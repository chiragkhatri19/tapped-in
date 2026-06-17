import { ZERO_MICROS, type MicroMap } from '@/data/micronutrients';

export type CookingState = 'raw' | 'cooked';

export interface LoggedIngredient {
  foodId: string;
  name: string;
  weightGrams: number;
  cookingState: CookingState;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  micros: MicroMap;
}

export interface OilEntry {
  oilType: 'mustard' | 'sunflower' | 'coconut' | 'olive' | 'ghee' | 'butter' | 'other';
  weightGrams: number;
  calories: number;
  fatG: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';

export interface LoggedMeal {
  id: string;
  name: string;
  mealType: MealType;
  ingredients: LoggedIngredient[];
  oilEntry?: OilEntry;
  loggedAt: string;
  dateKey: string;
  isCooked: boolean;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  micros: MicroMap;
  logMethod: 'manual' | 'ai_scan';
}

export interface DailyLog {
  dateKey: string;
  meals: LoggedMeal[];
  waterMl: number;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  micros: MicroMap;
  /** Daily weight check-in (kg) — optional; logged by user or prompted on app open */
  weightKg?: number;
}

export const OIL_DATA: Record<string, { caloriesPer100g: number; fatPer100g: number; label: string }> = {
  mustard:   { caloriesPer100g: 884, fatPer100g: 100,  label: 'Mustard Oil' },
  sunflower: { caloriesPer100g: 884, fatPer100g: 100,  label: 'Sunflower Oil' },
  coconut:   { caloriesPer100g: 862, fatPer100g: 99,   label: 'Coconut Oil' },
  olive:     { caloriesPer100g: 884, fatPer100g: 100,  label: 'Olive Oil' },
  ghee:      { caloriesPer100g: 900, fatPer100g: 99.5, label: 'Ghee' },
  butter:    { caloriesPer100g: 717, fatPer100g: 81,   label: 'Butter' },
  other:     { caloriesPer100g: 884, fatPer100g: 100,  label: 'Other Oil' },
};

export function computeOilEntry(oilType: OilEntry['oilType'], weightGrams: number): OilEntry {
  const data = OIL_DATA[oilType] ?? OIL_DATA.other;
  return {
    oilType,
    weightGrams,
    calories: Math.round((weightGrams / 100) * data.caloriesPer100g),
    fatG: Math.round(((weightGrams / 100) * data.fatPer100g) * 10) / 10,
  };
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  pre_workout: 'Pre Workout',
  post_workout: 'Post Workout',
};

export { ZERO_MICROS };
export type { MicroMap };

// ── Custom food (user-created, saved to MMKV) ─────────────
export interface CustomFoodItem {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  microsPer100g: MicroMap;
  servingGrams: number;
  createdAt: string;
}

// ── Saved meal template ───────────────────────────────────
export interface SavedMealIngredient {
  foodId: string;
  name: string;
  weightGrams: number;
  cookingState: CookingState;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  microsPer100g: MicroMap;
}

export interface SavedMealTemplate {
  id: string;
  name: string;
  ingredients: SavedMealIngredient[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  createdAt: string;
}
