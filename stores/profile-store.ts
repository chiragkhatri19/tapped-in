/**
 * Tapped In — Profile Zustand Store
 *
 * Canonical profile + plan result state (MMKV persist).
 * Use `useProfile()` for the familiar API or `useProfileStore` selectors.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage, zustandMMKVStorage, STORAGE_KEYS } from '@/lib/storage';
import { generatePlan } from '@/src/planGenerator';
import { calculateNEATScore } from '@/src/calorieEngine';
import { computeHydrationTarget } from '@/lib/hydration-engine';
import { getEffectiveDailySteps } from '@/lib/steps-utils';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import type { UserProfile as EngineUserProfile } from '@/src/types';
import type { UserProfile as AppProfile, FullResult, CalorieResult, MacroResult } from '@/types';

// ── Engine bridge ──────────────────────────────────────────────────────────
// The UI goal vocabulary (fat_loss | recomp | muscle_gain | maintain) is wider
// than the engine's (fat_loss | recomp | lean_bulk). Translate at the bridge:
//   muscle_gain → lean_bulk (surplus), maintain → recomp (no-surplus hold).
function toEngineGoal(goalMode: AppProfile['goalMode']): EngineUserProfile['goal'] {
  switch (goalMode) {
    case 'muscle_gain':
      return 'lean_bulk';
    case 'maintain':
      return 'recomp';
    default:
      return goalMode;
  }
}

function computeResult(profile: AppProfile): FullResult | null {
  try {
    const engineInput: EngineUserProfile = {
      age: profile.age,
      sex: profile.sex,
      height_cm: profile.heightCm,
      weight_kg: profile.weightKg,
      body_fat_percentage: profile.bodyFatPercent,
      training_days_per_week: profile.trainingDaysPerWeek,
      cardio_days_per_week: profile.cardioFrequency,
      cardio_minutes_per_session: profile.cardioDurationMin,
      steps_per_day: getEffectiveDailySteps() ?? profile.dailySteps,
      sitting_hours_per_day: profile.sittingHoursPerDay,
      goal: toEngineGoal(profile.goalMode),
      diet_preference: profile.dietType === 'non_veg' ? 'non_veg' : 'veg',
      deficit_preference: 'moderate',
    };

    const plan = generatePlan(engineInput);
    const neatResult = calculateNEATScore(engineInput);

    const calorieResult: CalorieResult = {
      bmr: plan.maintenance.bmr,
      maintenanceCalories: plan.maintenance.maintenance_best,
      targetCalories: plan.goal.target_calories,
      neatCategory: neatResult.neat_category as CalorieResult['neatCategory'],
      activityMultiplier: neatResult.multiplier,
      goalMode: profile.goalMode,
      deficit: plan.goal.adjustment,
    };

    const macroResult: MacroResult = {
      calories: plan.goal.target_calories,
      proteinG: plan.macros.protein_g,
      fatG: plan.macros.fat_g,
      carbG: plan.macros.carb_g,
      fiberG: plan.nutrition.fiber_g,
    };

    const { targetDrinkMl: hydrationMl } = computeHydrationTarget(profile);
    const notes: string[] = [...plan.meta.assumptions];

    return {
      profile,
      calories: calorieResult,
      macros: macroResult,
      hydrationMl,
      notes,
    };
  } catch (err) {
    console.error('[ProfileStore] computeResult failed:', err);
    return null;
  }
}

// ── Cloud bridge (snake_case Postgres row ⇄ camelCase AppProfile) ────────────

/** Shape returned by GET /api/profile (backend/src/routes/profile.ts). */
interface CloudProfileRow {
  age: number;
  sex: AppProfile['sex'];
  height_cm: number;
  weight_kg: number;
  body_fat_percent: number | null;
  experience: AppProfile['experience'];
  training_days_per_week: number;
  cardio_frequency: number;
  cardio_duration_min: number | null;
  daily_steps: number;
  sitting_hours_per_day: number;
  job_type: AppProfile['jobType'];
  goal_mode: AppProfile['goalMode'];
  unit_system: AppProfile['unitSystem'];
}

function mapCloudRowToProfile(row: CloudProfileRow): AppProfile {
  return {
    age: row.age,
    sex: row.sex,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    bodyFatPercent: row.body_fat_percent ?? undefined,
    experience: row.experience,
    trainingDaysPerWeek: row.training_days_per_week,
    cardioFrequency: row.cardio_frequency,
    cardioDurationMin: row.cardio_duration_min ?? 0,
    dailySteps: row.daily_steps,
    sittingHoursPerDay: row.sitting_hours_per_day,
    jobType: row.job_type,
    goalMode: row.goal_mode,
    unitSystem: row.unit_system ?? 'metric',
  };
}

/** Fire-and-forget push of the local profile to the cloud. Non-blocking. */
function pushProfileToCloud(token: string, profile: AppProfile): void {
  const payload = {
    age: profile.age,
    sex: profile.sex,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    bodyFatPercent: profile.bodyFatPercent,
    experience: profile.experience,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    cardioFrequency: profile.cardioFrequency,
    cardioDurationMin: profile.cardioDurationMin ?? 0,
    dailySteps: profile.dailySteps,
    sittingHoursPerDay: profile.sittingHoursPerDay,
    jobType: profile.jobType,
    goalMode: profile.goalMode,
    unitSystem: profile.unitSystem ?? 'metric',
  };
  apiClient.upsertProfile(token, payload).catch(() => {
    // Non-fatal — retried on the next session/foreground sync.
  });
}

// ── Store type ─────────────────────────────────────────────────────────────

interface ProfileState {
  profile: AppProfile | null;
  result: FullResult | null;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;

  saveProfile: (profile: AppProfile) => void;
  clearProfile: () => void;
  recalculate: () => void;
  /** Update only weight and optionally target weight, then recalculate targets */
  updateWeight: (weightKg: number, targetWeightKg?: number) => void;
  /**
   * Reconcile local profile with the cloud after a session is established.
   *
   * isNewSignIn=true  (SIGNED_IN event): Always hits the network first.
   *   - Cloud has profile → hydrate it (returning user, skip onboarding).
   *   - Cloud is empty   → clear any stale local state, send to onboarding.
   *
   * isNewSignIn=false (INITIAL_SESSION — cold start): Local data wins.
   *   - Local profile present → push it up to back up / heal an empty cloud row.
   *   - No local profile      → pull from cloud so returning users on a fresh
   *                             device skip onboarding.
   */
  reconcileWithCloud: (token: string, isNewSignIn?: boolean) => Promise<void>;
}

/** Context-era profile was raw JSON; Zustand persist wraps { state, version }. */
function migrateLegacyProfile(): void {
  try {
    const raw = storage.getString(STORAGE_KEYS.PROFILE);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && 'state' in parsed) return;
    if (parsed && typeof parsed === 'object' && 'age' in parsed && 'sex' in parsed) {
      const profile = parsed as AppProfile;
      storage.set(
        STORAGE_KEYS.PROFILE,
        JSON.stringify({
          state: { profile, hasCompletedOnboarding: true },
          version: 0,
        })
      );
    }
  } catch {
    // ignore corrupt blob
  }
}

migrateLegacyProfile();

// ── Store implementation ───────────────────────────────────────────────────

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      result: null,
      hasCompletedOnboarding: false,
      isLoading: true,

      saveProfile: (profile: AppProfile) => {
        const result = computeResult(profile);
        set({ profile, result, hasCompletedOnboarding: true });
        // Fire-and-forget cloud sync — MMKV is source of truth offline.
        // During onboarding there's usually no session yet; the push then
        // happens at sign-in via reconcileWithCloud().
        supabase.auth.getSession().then(({ data }) => {
          const token = data.session?.access_token;
          if (token) pushProfileToCloud(token, profile);
        });
      },

      clearProfile: () => {
        set({ profile: null, result: null, hasCompletedOnboarding: false });
      },

      recalculate: () => {
        const { profile } = get();
        if (!profile) return;
        const result = computeResult(profile);
        set({ result });
      },

      updateWeight: (weightKg: number, targetWeightKg?: number) => {
        const { profile } = get();
        if (!profile) return;
        const updated: AppProfile = {
          ...profile,
          weightKg,
          ...(targetWeightKg !== undefined && { targetWeightKg }),
        };
        const result = computeResult(updated);
        set({ profile: updated, result });
      },

      reconcileWithCloud: async (token: string, isNewSignIn = false) => {
        const local = get().profile;

        if (isNewSignIn) {
          // Active sign-in: always check the cloud to decide returning vs new user.
          try {
            const row = (await apiClient.getProfile(token)) as CloudProfileRow | null;
            if (row) {
              // Returning user signed in on this device → hydrate from cloud.
              const profile = mapCloudRowToProfile(row);
              const result = computeResult(profile);
              set({ profile, result, hasCompletedOnboarding: true });
            } else {
              // New account — clear any stale local data and force onboarding.
              set({ profile: null, result: null, hasCompletedOnboarding: false });
            }
          } catch {
            // Network error: if there's local data keep it; otherwise force onboarding.
            if (!local) set({ hasCompletedOnboarding: false });
          }
          return;
        }

        // Cold start (INITIAL_SESSION): local data wins offline-first.
        if (local) {
          pushProfileToCloud(token, local);
          return;
        }
        // No local data → returning user on a fresh device. Pull from cloud.
        try {
          const row = (await apiClient.getProfile(token)) as CloudProfileRow | null;
          if (!row) return;
          const profile = mapCloudRowToProfile(row);
          const result = computeResult(profile);
          set({ profile, result, hasCompletedOnboarding: true });
        } catch {
          // Non-fatal — user can still onboard offline.
        }
      },
    }),
    {
      name: STORAGE_KEYS.PROFILE,
      storage: createJSONStorage(() => zustandMMKVStorage),

      // Only persist the raw profile — result is always recomputed, never stale
      partialize: (state) => ({
        profile: state.profile,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),

      onRehydrateStorage: () => (state, err) => {
        if (err || !state) {
          useProfileStore.setState({ isLoading: false });
          return;
        }
        if (state.profile) {
          state.result = computeResult(state.profile);
          state.hasCompletedOnboarding = true;
        }
        state.isLoading = false;
      },
    }
  )
);

/** Drop-in replacement for context/profile-context useProfile() */
export function useProfile() {
  const profile = useProfileStore(s => s.profile);
  const result = useProfileStore(s => s.result);
  const hasCompletedOnboarding = useProfileStore(s => s.hasCompletedOnboarding);
  const isLoading = useProfileStore(s => s.isLoading);
  const saveProfile = useProfileStore(s => s.saveProfile);
  const clearProfile = useProfileStore(s => s.clearProfile);
  const recalculate = useProfileStore(s => s.recalculate);

  return {
    profile,
    result,
    hasCompletedOnboarding,
    isLoading,
    saveProfile: async (p: AppProfile) => {
      saveProfile(p);
    },
    clearProfile: async () => {
      clearProfile();
    },
    recalculate,
  };
}

// ── Convenience hooks ──────────────────────────────────────────────────────

/** Subscribe only to the computed result (re-renders only when result changes) */
const useResult = () => useProfileStore(s => s.result);

/** Subscribe only to profile metadata (name, goal, etc.) */
const useProfileMeta = () =>
  useProfileStore(s => ({
    profile: s.profile,
    hasCompletedOnboarding: s.hasCompletedOnboarding,
  }));

/** Subscribe only to mutations */
const useProfileActions = () =>
  useProfileStore(s => ({
    saveProfile: s.saveProfile,
    clearProfile: s.clearProfile,
    recalculate: s.recalculate,
  }));
