import type { WorkoutLog } from '@/stores/workout-store';
import { VOLUME_GROUPS, computeFractionalSets, type VolumeGroup, type Exercise } from '@/data/exercises';

// Evidence-based weekly volume targets (Schoenfeld et al. 2017)
// status bands per VolumeGroup:
//   lagging  < 10 sets
//   low      10-11
//   dialed   12-20   the sweet spot
//   junk     > 22

export type VolumeStatus = 'lagging' | 'low' | 'dialed' | 'junk';

export interface MuscleVolume {
  group: VolumeGroup;
  setsThisWeek: number;
  targetMin: number;
  targetMax: number;
  status: VolumeStatus;
}

export const VOLUME_TARGETS: Record<VolumeGroup, [number, number]> = {
  chest:      [12, 16],
  back:       [14, 18],
  shoulders:  [12, 16],
  biceps:     [10, 14],
  triceps:    [10, 14],
  quads:      [12, 16],
  hamstrings: [10, 14],
  glutes:     [10, 14],
  calves:     [8,  12],
  core:       [8,  12],
};

// Single source of truth for status bands - used by dashboard + builder live feedback.
export function volumeStatus(sets: number, [min /* , max */]: [number, number]): VolumeStatus {
  if (sets < 10)   return 'lagging';
  if (sets < min)  return 'low';
  if (sets <= 22)  return 'dialed';
  return 'junk';
}

const TARGETS = VOLUME_TARGETS;
const getStatus = volumeStatus;

// -- Main analytics function ---------------------------------------------------
// Computes fractional sets per VolumeGroup from logs in the trailing 7 days.

export function getWeeklyMuscleVolumes(
  logs: WorkoutLog[],
  customExercises: Exercise[] = []
): MuscleVolume[] {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter(l => !l.skipped && new Date(l.startedAt).getTime() >= cutoff);

  const totals: Record<VolumeGroup, number> = Object.fromEntries(
    VOLUME_GROUPS.map(g => [g, 0])
  ) as Record<VolumeGroup, number>;

  for (let i = 0; i < recentLogs.length; i++) {
    const log = recentLogs[i];
    for (let j = 0; j < log.exercises.length; j++) {
      const ex = log.exercises[j];
      const completedSets = ex.sets.filter(s => s.completedAt && !s.isWarmup).length;
      if (completedSets === 0) continue;

      // Use exerciseId if available; fall back to name-match
      const id = ex.exerciseId ?? ex.exerciseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_');

      const fractional = computeFractionalSets(id, completedSets, customExercises);
      const entries = Object.entries(fractional) as [VolumeGroup, number][];
      for (let k = 0; k < entries.length; k++) {
        const [group, sets] = entries[k];
        if (group in totals) totals[group] += sets;
      }
    }
  }

  return VOLUME_GROUPS.map(group => {
    const [min, max] = TARGETS[group];
    return {
      group,
      setsThisWeek: Math.round(totals[group] * 10) / 10,
      targetMin: min,
      targetMax: max,
      status: getStatus(totals[group], [min, max]),
    };
  });
}

// -- Weak-point detection -----------------------------------------------------

export interface WeakPoint {
  group: VolumeGroup;
  setsThisWeek: number;
  targetMin: number;
  deficit: number; // sets below targetMin
}

export function getWeakPoints(volumes: MuscleVolume[]): WeakPoint[] {
  return volumes
    .filter(v => v.status === 'lagging' || v.status === 'low')
    .map(v => ({
      group: v.group,
      setsThisWeek: v.setsThisWeek,
      targetMin: v.targetMin,
      deficit: v.targetMin - v.setsThisWeek,
    }))
    .sort((a, b) => b.deficit - a.deficit); // most lacking first
}

// -- Onboarding fallback -------------------------------------------------------
// When there's no log data yet, surface declared weak muscles as 'lagging'
// and mark everything else as neutral.

export function getOnboardingFallbackVolumes(
  weakMuscles: string[] = []
): MuscleVolume[] {
  const declared = new Set(weakMuscles.map(m => m.toLowerCase()));
  return VOLUME_GROUPS.map(group => {
    const [min, max] = TARGETS[group];
    const isWeak = declared.has(group);
    return {
      group,
      setsThisWeek: 0,
      targetMin: min,
      targetMax: max,
      status: isWeak ? 'lagging' : 'dialed', // neutral = assume ok until data proves otherwise
    };
  });
}

// -- Streak helper -------------------------------------------------------------

export function computeWorkoutStreak(logs: WorkoutLog[]): number {
  const completedDates = new Set(
    logs.filter(l => !l.skipped).map(l => l.date)
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (completedDates.has(key)) streak++;
    else if (i > 0) break; // gap breaks the streak (today being empty is allowed)
  }
  return streak;
}

// -- Weekly training days ------------------------------------------------------

function getWeeklySessionDates(logs: WorkoutLog[]): string[] {
  const today = new Date();
  const week: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    week.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  const completed = new Set(logs.filter(l => !l.skipped).map(l => l.date));
  return week.filter(d => completed.has(d));
}
