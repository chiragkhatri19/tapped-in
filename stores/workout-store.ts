/**
 * Tapped In - Workout Zustand Store
 *
 * Replaces the AsyncStorage-compat reads in workout.tsx with synchronous MMKV via Zustand persist.
 * This is what kills the loading screen - no async reads = instant dashboard render.
 *
 * Usage (selector pattern, never select the whole store):
 *   const activePlan  = useWorkoutStore(s => s.activePlan());
 *   const addPlan     = useWorkoutStore(s => s.addPlan);
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage, zustandMMKVStorage, STORAGE_KEYS } from '@/lib/storage';
import type { Exercise } from '@/data/exercises';

// -- Shared data types ---------------------------------------------------------
// These extend (not replace) the shapes the existing workout components already read.

export interface WorkoutExercise {
  order: number;
  exerciseId?: string;       // canonical DB id (added by Phase 5 hydration; optional for legacy)
  name: string;
  muscleGroup: string;
  muscleGroupSecondary: string | null;
  isCompound: boolean;
  isPriorityLift: boolean;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo: string;
  /** Reps-in-reserve target (1-3). Goal-driven: fat_loss/maintain=2-3, muscle_gain=1-2, recomp=2. */
  rir: number;
  coachingCue: string;
  alternatives: string[];
  healthModification: string | null;
  progressionRule: string;
}

/** A single scheduled cardio session within the programme. */
export interface CardioSession {
  /** Day this session falls on (e.g. 'monday'). */
  day: string;
  modality: string;           // e.g. 'incline walk', 'cycling', 'HIIT intervals'
  durationMin: number;
  hrZone: {
    label: string;            // e.g. 'Zone 2 / LISS', 'HIIT'
    bpmLow: number;
    bpmHigh: number;
  };
  /** Plain-language session structure, e.g. "steady-state — maintain zone 2 throughout". */
  structure: string;
  /** 'post_lift' | 'standalone' */
  placement: 'post_lift' | 'standalone';
  rationale: string;
  evidenceId: string;
}

/** Top-level cardio programme attached to a WorkoutPlan. */
export interface CardioProgram {
  sessionsPerWeek: number;
  totalCardioMinPerWeek: number;
  maxHR: number;
  preferredTypes: string[];
  goalRationale: string;
  sessions: CardioSession[];
}

export interface WorkoutSession {
  name: string;
  sessionGoal: string;
  estimatedDurationMin: number;
  musclesFocused: string[];
  exercises: WorkoutExercise[];
  /**
   * Post-lift cardio block for this session, if one is scheduled.
   * Derived from CardioProgram; kept here for the logger to render it inline.
   */
  cardioBlock: {
    durationMin: number;
    targetHRbpm: string;
    hrZone?: CardioSession['hrZone'];
    modality?: string;
    type?: string;
    evidenceId?: string;
  } | null;
}

export interface WorkoutPlan {
  id: string;
  isActive: boolean;
  createdAt: string;
  source: 'ai' | 'manual';
  splitName: string;
  splitType: string;
  programmeRationale: string;
  weeklySchedule: Record<string, string>;
  sessions: WorkoutSession[];
  weeklyVolumeByMuscle: Record<string, { setsPerWeek: number; frequency: number }>;
  /** Full personalized cardio programme (new). null = no cardio prescribed. */
  cardioProgram: CardioProgram | null;
  /**
   * Legacy back-compat shim — old persisted plans have this shape.
   * Read cardioProgram first; fall back to cardioSummary for old plans.
   * @deprecated use cardioProgram
   */
  cardioSummary?: {
    recommendation: string;
    frequency: string;
    duration: string;
    targetHR: string;
    timing: string;
    preferredTypes: string[];
    goalRationale: string;
  } | null;
  progressionPlan: string;
  hotTakes: string[];
  citations: { claim: string; authors: string; year: number; journal: string; doi: string }[];
}

export interface SetLog {
  setNumber: number;
  isWarmup: boolean;
  /** Extended set type. Old logs only have isWarmup; new logs also have setType. */
  setType?: 'normal' | 'warmup' | 'drop' | 'failure';
  weightKg: number;
  reps: number;
  rpe: number | null;
  completedAt: string | null;
  isPR: boolean;
}

export interface ExerciseLog {
  exerciseName: string;
  exerciseId?: string;
  muscleGroup: string;
  sets: SetLog[];
  totalVolume: number;
  notes: string;
}

export interface WorkoutLog {
  id: string;
  planId: string | null;
  sessionName: string;
  date: string;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  exercises: ExerciseLog[];
  totalVolume: number;
  totalSets: number;
  prsAchieved: string[];
  feelingRating: number | null;
  energyLevel: number | null;
  sleepLastNight: number | null;
  notes: string;
  cardioCompleted: boolean;
  cardioMinutes: number | null;
  /** Modality logged, e.g. 'incline walk'. Optional — new field, old logs don't have it. */
  cardioModality?: string | null;
  /** Self-reported average heart rate during cardio. Optional — new field. */
  cardioAvgHR?: number | null;
  skipped?: boolean;
}

export interface ExercisePR {
  estimated1RM: number;
  maxWeight: number;
  maxReps: number;
  achievedAt: string;
}

export interface ActiveWorkoutState {
  id: string;
  planId: string | null;
  sessionName: string;
  date: string;
  startedAt: string;
  elapsedSeconds: number;
  currentExerciseIndex: number;
  exercises: any[];
}

// -- Store type ----------------------------------------------------------------

interface WorkoutState {
  plans: WorkoutPlan[];
  logs: WorkoutLog[];
  exercisePRs: Record<string, ExercisePR>;
  activeWorkout: ActiveWorkoutState | null;
  customExercises: Exercise[];

  // Derived selectors
  activePlan: () => WorkoutPlan | null;
  todaySession: () => WorkoutSession | null;
  recentLogs: (n?: number) => WorkoutLog[];

  // Plan mutations
  addPlan: (plan: WorkoutPlan) => void;
  updatePlan: (id: string, patch: Partial<WorkoutPlan>) => void;
  deletePlan: (id: string) => void;
  setActivePlan: (id: string) => void;

  // Log mutations
  addLog: (log: WorkoutLog) => void;
  deleteLog: (id: string) => void;

  // PR mutations
  upsertPR: (exerciseName: string, pr: ExercisePR) => void;

  // Active workout (crash recovery)
  saveActiveWorkout: (state: ActiveWorkoutState) => void;
  clearActiveWorkout: () => void;

  // Custom exercises
  addCustomExercise: (ex: Exercise) => void;
}

// -- Date helper ---------------------------------------------------------------

function getTodayDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

// -- Store implementation ------------------------------------------------------

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      plans: [],
      logs: [],
      exercisePRs: {},
      activeWorkout: null,
      customExercises: [],

      activePlan: () => {
        const plans = get().plans;
        return plans.find(p => p.isActive) ?? plans[0] ?? null;
      },

      todaySession: () => {
        const plan = get().activePlan();
        if (!plan) return null;
        const dayName = getTodayDayName();
        const sessionName = plan.weeklySchedule[dayName];
        if (!sessionName || sessionName === 'Rest' || sessionName === 'Active Rest') return null;
        return plan.sessions.find(s => s.name === sessionName) ?? null;
      },

      recentLogs: (n = 5) => {
        return [...get().logs]
          .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
          .slice(0, n);
      },

      // -- Plans ---------------------------------------------------------------

      addPlan: (plan) => {
        set(state => {
          const wasEmpty = state.plans.length === 0;
          const plans = state.plans.map(p => ({ ...p, isActive: false }));
          return { plans: [...plans, { ...plan, isActive: wasEmpty || plan.isActive }] };
        });
      },

      updatePlan: (id, patch) => {
        set(state => ({
          plans: state.plans.map(p => p.id === id ? { ...p, ...patch } : p),
        }));
      },

      deletePlan: (id) => {
        set(state => {
          const remaining = state.plans.filter(p => p.id !== id);
          // if we deleted the active plan, promote the first remaining
          if (remaining.length > 0 && !remaining.some(p => p.isActive)) {
            remaining[0] = { ...remaining[0], isActive: true };
          }
          return { plans: remaining };
        });
      },

      setActivePlan: (id) => {
        set(state => ({
          plans: state.plans.map(p => ({ ...p, isActive: p.id === id })),
        }));
      },

      // -- Logs ----------------------------------------------------------------

      addLog: (log) => {
        set(state => ({ logs: [...state.logs, log] }));
      },

      deleteLog: (id) => {
        set(state => ({ logs: state.logs.filter(l => l.id !== id) }));
      },

      // -- PRs -----------------------------------------------------------------

      upsertPR: (exerciseName, pr) => {
        set(state => ({
          exercisePRs: { ...state.exercisePRs, [exerciseName]: pr },
        }));
      },

      // -- Active workout -------------------------------------------------------

      saveActiveWorkout: (aw) => set({ activeWorkout: aw }),
      clearActiveWorkout: () => set({ activeWorkout: null }),

      // -- Custom exercises -----------------------------------------------------

      addCustomExercise: (ex) => {
        set(state => ({
          customExercises: [...state.customExercises.filter(e => e.id !== ex.id), ex],
        }));
      },
    }),
    {
      name: STORAGE_KEYS.WORKOUT_PLANS,
      storage: createJSONStorage(() => zustandMMKVStorage),
      // Persist everything - the keys are all stable
    }
  )
);

// -- Legacy migrator -----------------------------------------------------------
// One-time: moves the four old AsyncStorage-compat blobs into the Zustand store.
// Safe to call on every app start - bails out early if already migrated or no legacy data.

export function migrateLegacyWorkoutData(): void {
  const state = useWorkoutStore.getState();
  if (state.plans.length > 0 || state.logs.length > 0) return; // already migrated

  try {
    // Plans (new multi-plan key)
    const plansRaw = storage.getString('tapped_in_workout_plans');
    if (plansRaw) {
      const parsed = JSON.parse(plansRaw);
      const plans: WorkoutPlan[] = Array.isArray(parsed)
        ? parsed
        : [{ ...parsed, id: parsed.id ?? Date.now().toString(), isActive: true, source: 'ai' as const, createdAt: new Date().toISOString() }];
      if (plans.length > 0) {
        plans.forEach((p, i) => state.addPlan({ ...p, isActive: i === 0 }));
      }
    } else {
      // Legacy single-plan key
      const legacyRaw = storage.getString('tapped_in_workout_plan');
      if (legacyRaw) {
        const p = JSON.parse(legacyRaw);
        state.addPlan({ ...p, id: p.id ?? Date.now().toString(), isActive: true, source: 'ai', createdAt: new Date().toISOString() });
      }
    }

    // Logs
    const logsRaw = storage.getString('tapped_in_workout_logs');
    if (logsRaw) {
      const logs: WorkoutLog[] = JSON.parse(logsRaw);
      logs.forEach(l => state.addLog(l));
    }

    // PRs
    const prsRaw = storage.getString('tapped_in_exercise_prs');
    if (prsRaw) {
      const prs: Record<string, ExercisePR> = JSON.parse(prsRaw);
      Object.entries(prs).forEach(([name, pr]) => state.upsertPR(name, pr));
    }

    // Active workout (crash recovery)
    const awRaw = storage.getString('tapped_in_active_workout');
    if (awRaw) {
      state.saveActiveWorkout(JSON.parse(awRaw));
    }
  } catch {
    // Corrupt legacy data - start fresh. Existing users with no data lose nothing.
  }
}
