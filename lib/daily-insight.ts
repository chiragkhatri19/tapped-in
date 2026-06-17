import { MICRONUTRIENTS, type MicroMap } from '@/data/micronutrients';
import type { DailyLog } from '@/data/tracker-types';

export interface DailyInsight {
  title: string;
  body: string;
  route?: '/log-meal' | '/(tabs)/index' | '/(tabs)/profile';
}

export function getDailyInsight(input: {
  todayMicros: MicroMap;
  todayLog: DailyLog | null;
  recentLogs: DailyLog[];
  targetProteinG: number;
  targetCalories: number;
}): DailyInsight {
  const vitaminD = MICRONUTRIENTS.find((m) => m.key === 'vitaminD');
  if (vitaminD && (input.todayMicros.vitaminD ?? 0) / vitaminD.rda < 0.5) {
    return { title: 'close one nutrient gap', body: 'vitamin D is low today — add fatty fish/eggs or check off D3 if you take it.', route: '/log-meal' };
  }

  const low = MICRONUTRIENTS.find((m) => m.commonlyLow && m.kind === 'reach' && (input.todayMicros[m.key] ?? 0) / m.rda < 0.45);
  if (low) {
    return { title: `${low.label} needs attention`, body: `you're under half the daily target. food first, supplement if this keeps repeating.`, route: '/log-meal' };
  }

  const proteinStreak = input.recentLogs.slice(-3).filter((log) => (log.totalProteinG ?? 0) >= input.targetProteinG * 0.9).length;
  if (proteinStreak >= 3) {
    return { title: 'protein consistency is working', body: 'you have been within 90% of protein for 3 logged days running.', route: '/(tabs)/index' };
  }

  if (!input.todayLog || input.todayLog.meals.length === 0) {
    return { title: 'log the first meal early', body: 'early logging makes the rest of the day easier to steer.', route: '/log-meal' };
  }

  const calories = input.todayLog.totalCalories;
  if (input.targetCalories > 0 && calories > input.targetCalories * 1.05) {
    return { title: 'calories are over target', body: 'keep dinner lean and protein-forward; do not crash diet tomorrow.', route: '/(tabs)/index' };
  }

  return { title: 'steady day so far', body: 'macros are logged — now check micronutrients and water before the day gets away.', route: '/(tabs)/index' };
}
