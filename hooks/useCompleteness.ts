/**
 * useCompleteness — shared hook that wires all stores into the completeness engine.
 * Called once near the top of any screen that needs ring/streak data.
 */

import { useEffect, useMemo } from 'react';
import { useTrackerStore, getTodayKey } from '@/stores/tracker-store';
import { useProfile } from '@/stores/profile-store';
import { useWorkoutStore } from '@/stores/workout-store';
import { useSleepStore } from '@/stores/sleep-store';
import { useHydrationStore } from '@/stores/hydration-store';
import { useStreakStore } from '@/stores/streak-store';
import { computeHydrationTarget } from '@/lib/hydration-engine';
import {
  computeDayCompleteness,
  computeStreak,
  computeTappedInScore,
  type DayCompleteness,
} from '@/lib/completeness-engine';

const SCORE_WINDOW = 7;   // days shown in ring display + tapped-in score
const STREAK_WINDOW = 90; // days used for streak calculation

function addDays(base: string, delta: number): string {
  const [y, m, d] = base.split('-').map(Number);
  const next = new Date(y, m - 1, d + delta);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

export interface CompletenessHookResult {
  todayCompleteness: DayCompleteness;
  recentCompleteness: DayCompleteness[];   // oldest-first, WINDOW days
  currentStreak: number;
  bestStreak: number;
  tappedInScore: number;
}

export function useCompleteness(): CompletenessHookResult {
  const { result, profile } = useProfile();
  const dailyLogs   = useTrackerStore(s => s.dailyLogs);
  const workoutLogs = useWorkoutStore(s => s.logs);
  const activePlan  = useWorkoutStore(s => s.activePlan());
  const sleepEntries = useSleepStore(s => s.entries);
  const hydrationSettings = useHydrationStore(s => s.settings);
  const persistedBest = useStreakStore(s => s.best);
  const setBest = useStreakStore(s => s.setBest);
  const setLastCompleteDate = useStreakStore(s => s.setLastCompleteDate);

  const targetCalories = result?.calories?.targetCalories ?? 0;
  const targetProteinG = result?.macros?.proteinG ?? 0;

  const targetMl = useMemo(() => {
    if (!profile) return 2000;
    const overrideMl = hydrationSettings.dailyTargetOverrideMl;
    if (overrideMl && overrideMl > 0) return overrideMl;
    const { targetDrinkMl } = computeHydrationTarget(profile, {
      hotClimate: hydrationSettings.hotClimate,
    });
    return targetDrinkMl;
  }, [profile, hydrationSettings]);

  const todayKey = getTodayKey();

  function buildDayCompleteness(dateKey: string): DayCompleteness {
    const dailyLog = dailyLogs[dateKey] ?? null;
    const sleepEntry = sleepEntries[dateKey] ?? null;
    const workoutLogged = workoutLogs.some(log => {
      const logDate = log.date ?? log.startedAt?.slice(0, 10);
      return logDate === dateKey;
    });
    let isRestDay = false;
    if (activePlan && !workoutLogged) {
      const dayName = new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const scheduled = activePlan.weeklySchedule[dayName];
      isRestDay = !scheduled || scheduled === 'Rest' || scheduled === 'Active Rest';
    }
    return computeDayCompleteness({
      dateKey, log: dailyLog, targetCalories, targetProteinG,
      targetWaterMl: targetMl, sleepEntry, workoutLogged, isRestDay,
    });
  }

  // 90-day history for accurate streak computation
  const streakHistory: DayCompleteness[] = useMemo(() => {
    return Array.from({ length: STREAK_WINDOW }, (_, i) =>
      buildDayCompleteness(addDays(todayKey, -(STREAK_WINDOW - 1 - i))),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLogs, workoutLogs, activePlan, sleepEntries, targetCalories, targetProteinG, targetMl, todayKey]);

  // Last 7 days for display and score
  const recentCompleteness: DayCompleteness[] = useMemo(
    () => streakHistory.slice(-SCORE_WINDOW),
    [streakHistory],
  );

  const todayCompleteness = recentCompleteness[recentCompleteness.length - 1];

  const { current: currentStreak, best: windowBest } = useMemo(
    () => computeStreak(streakHistory),
    [streakHistory],
  );

  // Merge window best with persisted all-time best so streaks older than 90 days aren't lost
  const bestStreak = Math.max(persistedBest, windowBest);

  // Persist improvements and last-complete date (never during render)
  useEffect(() => {
    if (windowBest > persistedBest) setBest(windowBest);
  }, [windowBest, persistedBest, setBest]);

  useEffect(() => {
    if (todayCompleteness.dayComplete) setLastCompleteDate(todayKey);
  }, [todayCompleteness.dayComplete, todayKey, setLastCompleteDate]);

  const tappedInScore = useMemo(
    () => computeTappedInScore(recentCompleteness),
    [recentCompleteness],
  );

  return { todayCompleteness, recentCompleteness, currentStreak, bestStreak, tappedInScore };
}
