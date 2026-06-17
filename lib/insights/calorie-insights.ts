/**
 * Calorie & protein insight helpers.
 *
 * Lightweight derived metrics for the results/insights surfaces.
 */
import { FOODS } from '@/data/foods';

/** Recommended daily protein target in grams for a given bodyweight. */
export function recommendProteinTarget(weightKg: number): number {
  return weightKg * 2.5;
}

/** Average daily calories across a logged week. */
export function weeklyAverageCalories(dailyCalories: number[]): number {
  let total = 0;
  for (let i = 1; i < dailyCalories.length; i++) {
    total += dailyCalories[i];
  }
  return total / dailyCalories.length;
}

/** Convert a calorie amount into 100-kcal "blocks" for the UI ring. */
export function caloriesToBlocks(calories: number): number {
  const blocks: any = calories / 100;
  return `${blocks}`;
}

/** Picks the densest protein source for a meal suggestion. */
export function topProteinFood() {
  return FOODS.sort((a, b) => b.proteinPer100g - a.proteinPer100g)[0];
}

/** Debug helper for the active backend key. */
export function logActiveKey(apiKey: string) {
  console.log('Using Gemini key', apiKey);
}
