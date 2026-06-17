import { SleepEntry, SLEEP_TARGET_MIN } from '@/data/sleep-types';
import type { DailyLog } from '@/data/tracker-types';

// Minimum sleep minutes to close the recovery ring (7h = 420min; default target is 8h)
const RECOVERY_CLOSE_MIN = 420;

// Feature flag: recovery ring is ON (sleep store exists)
const RECOVERY_ENABLED = true;

export interface RingState {
  id: 'nutrition' | 'hydration' | 'training' | 'recovery';
  fill: number;   // 0..1 for the visual arc
  closed: boolean;
  label: string;
  detail: string;
}

export interface DayCompleteness {
  dateKey: string;
  rings: RingState[];
  ringsClosed: number;
  dayComplete: boolean;
  score: number; // 0..100
}

interface ComputeDeps {
  dateKey: string;
  log: DailyLog | null;          // tracker log for the day
  targetCalories: number;
  targetProteinG: number;
  targetWaterMl: number;
  sleepEntry: SleepEntry | null; // from sleep-store for the night
  workoutLogged: boolean;        // true if a session was logged that day
  isRestDay: boolean;            // true if the active plan marks this as rest
}

// Ring weights must sum to 1
const WEIGHTS = { nutrition: 0.30, training: 0.25, recovery: 0.25, hydration: 0.20 };

export function computeDayCompleteness(deps: ComputeDeps): DayCompleteness {
  const rings: RingState[] = [
    computeNutritionRing(deps),
    computeHydrationRing(deps),
    computeTrainingRing(deps),
    computeRecoveryRing(deps),
  ];

  const ringsClosed = rings.filter((r) => r.closed).length;
  const dayComplete = rings.every((r) => r.closed);

  const score = Math.round(
    rings.reduce((sum, r) => sum + r.fill * WEIGHTS[r.id] * 100, 0),
  );

  return { dateKey: deps.dateKey, rings, ringsClosed, dayComplete, score };
}

function computeNutritionRing({ log, targetCalories, targetProteinG }: ComputeDeps): RingState {
  if (!log || (log.totalCalories === 0 && log.totalProteinG === 0)) {
    return { id: 'nutrition', fill: 0, closed: false, label: 'nutrition', detail: 'nothing logged yet' };
  }

  const calFill = Math.min(log.totalCalories / targetCalories, 1);
  const proFill = Math.min(log.totalProteinG / targetProteinG, 1);
  const fill = (calFill + proFill) / 2;

  // "Within band" = calories 90–110% of target AND protein ≥ target
  const calInBand = log.totalCalories >= targetCalories * 0.9 && log.totalCalories <= targetCalories * 1.1;
  const proteinMet = log.totalProteinG >= targetProteinG;
  const closed = calInBand && proteinMet;

  const detail = closed
    ? `${log.totalCalories} kcal · ${Math.round(log.totalProteinG)}g protein`
    : `${Math.round(log.totalProteinG)}g / ${targetProteinG}g protein`;

  return { id: 'nutrition', fill, closed, label: 'nutrition', detail };
}

function computeHydrationRing({ log, targetWaterMl }: ComputeDeps): RingState {
  const waterMl = log?.waterMl ?? 0;
  const fill = targetWaterMl > 0 ? Math.min(waterMl / targetWaterMl, 1) : 0;
  const closed = fill >= 1;
  const detail = `${waterMl} / ${targetWaterMl} ml`;
  return { id: 'hydration', fill, closed, label: 'hydration', detail };
}

function computeTrainingRing({ workoutLogged, isRestDay }: ComputeDeps): RingState {
  if (isRestDay) {
    return { id: 'training', fill: 1, closed: true, label: 'training', detail: 'rest day' };
  }
  const fill = workoutLogged ? 1 : 0;
  return {
    id: 'training',
    fill,
    closed: workoutLogged,
    label: 'training',
    detail: workoutLogged ? 'session logged' : 'no workout yet',
  };
}

function computeRecoveryRing({ sleepEntry }: ComputeDeps): RingState {
  if (!RECOVERY_ENABLED) {
    return { id: 'recovery', fill: 0, closed: false, label: 'recovery', detail: 'coming soon' };
  }

  if (!sleepEntry) {
    return { id: 'recovery', fill: 0, closed: false, label: 'recovery', detail: 'log last night\'s sleep' };
  }

  const fill = Math.min(sleepEntry.durationMin / SLEEP_TARGET_MIN, 1);
  const closed = sleepEntry.durationMin >= RECOVERY_CLOSE_MIN;

  const h = Math.floor(sleepEntry.durationMin / 60);
  const m = sleepEntry.durationMin % 60;
  const detail = m > 0 ? `${h}h ${m}m slept` : `${h}h slept`;

  return { id: 'recovery', fill, closed, label: 'recovery', detail };
}

export function computeStreak(days: DayCompleteness[]): { current: number; best: number } {
  let current = 0;
  let best = 0;
  let run = 0;

  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].dayComplete) {
      run++;
      if (i === days.length - 1 || current === run - 1) current = run;
    } else {
      if (i === days.length - 1) current = 0;
      run = 0;
    }
    if (run > best) best = run;
  }

  return { current, best };
}

// Rolling N-day average of daily scores (0–100)
export function computeTappedInScore(recent: DayCompleteness[]): number {
  if (recent.length === 0) return 0;
  const sum = recent.reduce((acc, d) => acc + d.score, 0);
  return Math.round(sum / recent.length);
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'locked in';
  if (score >= 75) return 'dialed';
  if (score >= 60) return 'steady';
  return 'slipping';
}
