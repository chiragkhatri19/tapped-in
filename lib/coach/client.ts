/**
 * Coach Gemini client.
 *
 * Send flow: the request always goes to the authenticated Railway backend
 * (POST /api/coach), which holds the Gemini key server-side and enforces auth +
 * per-user rate limiting. The Gemini key is NEVER bundled into the app — an
 * EXPO_PUBLIC_* key would be extractable from the shipped APK.
 */

import { parseCoachResponse } from './validate';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import type { CoachResponse, CoachMessage } from './actions';
import type { CoachContext } from './prompt';

// ─── Context sanitization ─────────────────────────────────────────────────────
// The backend validates context field-by-field with strict Zod bounds. Any value
// out of range silently 400s the whole request. We clamp/normalize here so a
// signed-in user with real data never trips the schema.

const GOAL_MODES = ['fat_loss', 'recomp', 'muscle_gain', 'maintain'] as const;
const EXPERIENCES = ['beginner', 'intermediate', 'advanced'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function clamp(n: unknown, min: number, max: number, fallback = min): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, v));
}

function clampNullable(n: number | null | undefined, min: number, max: number): number | null {
  if (n === null || n === undefined || !Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

function sanitizeContext(ctx: CoachContext): CoachContext {
  const recentWorkouts = (ctx.recentWorkouts ?? [])
    .filter(w => DATE_RE.test(w.date ?? ''))
    .slice(0, 5)
    .map(w => ({
      date: w.date,
      sessionName: (w.sessionName ?? '').slice(0, 100),
      totalSets: clamp(w.totalSets, 0, 300, 0),
      durationMinutes: clamp(w.durationMinutes, 0, 360, 0),
      prsAchieved: (w.prsAchieved ?? []).slice(0, 20).map(p => String(p).slice(0, 60)),
    }));

  const lf = ctx.lastWorkoutFeeling;
  const lastWorkoutFeeling = lf && DATE_RE.test(lf.date ?? '')
    ? {
        sessionName: (lf.sessionName ?? '').slice(0, 100),
        date: lf.date,
        feelingRating: clampNullable(lf.feelingRating, 1, 5),
        energyLevel: clampNullable(lf.energyLevel, 1, 5),
        sleepLastNight: clampNullable(lf.sleepLastNight, 0, 24),
        avgRpe: clampNullable(lf.avgRpe, 0, 10),
        notes: (lf.notes ?? '').slice(0, 500),
      }
    : null;

  const exercisePRs: CoachContext['exercisePRs'] = {};
  for (const [name, pr] of Object.entries(ctx.exercisePRs ?? {}).slice(0, 60)) {
    if (!pr) continue;
    exercisePRs[name.slice(0, 100)] = {
      maxWeight: clamp(pr.maxWeight, 0, 600, 0),
      maxReps: clamp(pr.maxReps, 0, 200, 0),
      estimated1RM: clamp(pr.estimated1RM, 0, 800, 0),
      achievedAt: pr.achievedAt,
    };
  }

  const weeklyVolumeByMuscle: CoachContext['weeklyVolumeByMuscle'] = {};
  for (const [muscle, v] of Object.entries(ctx.weeklyVolumeByMuscle ?? {}).slice(0, 30)) {
    if (!v) continue;
    weeklyVolumeByMuscle[muscle.slice(0, 50)] = {
      setsPerWeek: clamp(v.setsPerWeek, 0, 200, 0),
      frequency: clamp(v.frequency, 0, 7, 0),
    };
  }

  return {
    ...ctx,
    goalMode: (GOAL_MODES as readonly string[]).includes(ctx.goalMode) ? ctx.goalMode : 'recomp',
    experience: (EXPERIENCES as readonly string[]).includes(ctx.experience) ? ctx.experience : 'beginner',
    weightKg: clamp(ctx.weightKg, 20, 300, 70),
    targetCalories: clamp(ctx.targetCalories, 500, 8000, 2200),
    targetProteinG: clamp(ctx.targetProteinG, 0, 600, 160),
    targetCarbsG: clamp(ctx.targetCarbsG, 0, 1200, 220),
    targetFatG: clamp(ctx.targetFatG, 0, 500, 70),
    todayDate: DATE_RE.test(ctx.todayDate) ? ctx.todayDate : new Date().toISOString().slice(0, 10),
    todayMeals: (ctx.todayMeals ?? []).slice(0, 30).map(m => ({
      name: (m.name ?? 'meal').slice(0, 100),
      mealType: (m.mealType ?? 'snack').slice(0, 20),
      totalCalories: clamp(m.totalCalories, 0, 5000, 0),
      totalProteinG: clamp(m.totalProteinG, 0, 500, 0),
      hasOil: !!m.hasOil,
      isCooked: !!m.isCooked,
    })),
    todayTotals: {
      calories: clamp(ctx.todayTotals?.calories, 0, 15000, 0),
      proteinG: clamp(ctx.todayTotals?.proteinG, 0, 1000, 0),
      carbsG: clamp(ctx.todayTotals?.carbsG, 0, 2000, 0),
      fatG: clamp(ctx.todayTotals?.fatG, 0, 1000, 0),
    },
    daysLoggedLast7: clamp(ctx.daysLoggedLast7, 0, 7, 0),
    avg7DayCalories: clampNullable(ctx.avg7DayCalories, 0, 15000),
    avg7DayProtein: clampNullable(ctx.avg7DayProtein, 0, 1000),
    splitName: ctx.splitName ? ctx.splitName.slice(0, 100) : null,
    todaySession: ctx.todaySession ? ctx.todaySession.slice(0, 100) : null,
    totalSessions: clamp(ctx.totalSessions, 0, 14, 0),
    recentWorkouts,
    exercisePRs,
    lastWorkoutFeeling,
    weeklyVolumeByMuscle,
    dietType: ctx.dietType ? ctx.dietType.slice(0, 30) : null,
    meatPreferences: (ctx.meatPreferences ?? []).slice(0, 10).map(s => String(s).slice(0, 30)),
    cookingContext: ctx.cookingContext ? ctx.cookingContext.slice(0, 100) : null,
    budgetTier: ctx.budgetTier ? ctx.budgetTier.slice(0, 30) : null,
    neatCategory: (ctx.neatCategory ?? 'moderate').slice(0, 30),
    deficitSurplus: clamp(ctx.deficitSurplus, -3000, 3000, 0),
    cookedMealsWithoutOil: clamp(ctx.cookedMealsWithoutOil, 0, 30, 0),
    cookedMealsCount: clamp(ctx.cookedMealsCount, 0, 30, 0),
    plans: (ctx.plans ?? []).slice(0, 10).map(p => ({
      id: (p.id ?? '').slice(0, 100),
      name: (p.name ?? 'plan').slice(0, 100),
      isActive: !!p.isActive,
      sessionNames: (p.sessionNames ?? []).slice(0, 7).map(s => String(s).slice(0, 60)),
    })),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Coach needs the authenticated backend. Returned when there's no session. */
function signInResponse(): CoachResponse {
  return {
    message:
      "i can't reach your coach brain right now. sign in from your profile and i'll have full access.",
    citations: [],
    actions: [{ kind: 'navigate', label: 'go to profile to sign in', route: '/(tabs)/profile' }],
    followUpSuggestions: [],
    isOffTopic: false,
  };
}

export async function sendToCoach(
  userMessage: string,
  history: CoachMessage[],
  context: CoachContext,
): Promise<CoachResponse> {
  const ctx = sanitizeContext(context);

  // Backend path only — Gemini lives server-side. Needs a Supabase session.
  let token: string | undefined;
  try {
    token = (await supabase.auth.getSession()).data.session?.access_token;
  } catch (e) {
    console.warn('[coach] getSession failed:', e);
  }

  if (!token) return signInResponse();

  try {
    const raw = await apiClient.postCoach(token, {
      userMessage,
      history: history.slice(-16),
      context: ctx,
    });
    return parseCoachResponse(raw);
  } catch (err) {
    console.error('[coach] backend call failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

