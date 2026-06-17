/**
 * Pure meal-building helpers — shared between:
 *   app/log-meal.tsx  (manual wizard)
 *   app/meal-review.tsx  (coach-driven review screen)
 *
 * No hooks, no side-effects. Call from anywhere.
 */

import type { FoodItem } from '@/data/foods';
import {
  type LoggedMeal, type LoggedIngredient, type OilEntry, type MealType,
} from '@/data/tracker-types';
import { getTodayKey } from '@/stores/tracker-store';
import { createZeroMicros, scaleMicros, sumMicros, type MicroMap } from '@/data/micronutrients';

// ─── EditableIngredient ───────────────────────────────────────────────────────

export interface EditableIngredient {
  uid: string;
  foodId: string;
  name: string;
  nameHindi: string;
  weightGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  microsPer100g: MicroMap;
  /** True when the AI could not match this item to a food in the database. */
  needsReview?: boolean;
}

/** A review-ready meal draft — used by CoachMealCard and the review screen. */
export interface ReviewMeal {
  uid: string;
  mealName: string;
  mealType: MealType;
  isCooked: boolean;
  ingredients: EditableIngredient[];
  oilEntry?: OilEntry;
  oilHint?: { likely: boolean; oilType?: OilEntry['oilType']; estimatedGrams?: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getDefaultMealType(): MealType {
  const min = new Date().getHours() * 60 + new Date().getMinutes();
  if (min < 630)  return 'breakfast';
  if (min < 780)  return 'lunch';
  if (min < 1020) return 'snack';
  if (min < 1230) return 'dinner';
  return 'snack';
}

export function ingMacros(e: EditableIngredient) {
  const f = e.weightGrams / 100;
  return {
    kcal: Math.round(f * e.caloriesPer100g),
    p:    Math.round(f * e.proteinPer100g  * 10) / 10,
    c:    Math.round(f * e.carbsPer100g    * 10) / 10,
    fat:  Math.round(f * e.fatPer100g      * 10) / 10,
  };
}

export function toLoggedIngredient(e: EditableIngredient): LoggedIngredient {
  const f = e.weightGrams / 100;
  return {
    foodId: e.foodId, name: e.name, weightGrams: e.weightGrams, cookingState: 'cooked',
    calories:   Math.round(f * e.caloriesPer100g),
    proteinG:   Math.round(f * e.proteinPer100g  * 10) / 10,
    carbsG:     Math.round(f * e.carbsPer100g    * 10) / 10,
    fatG:       Math.round(f * e.fatPer100g      * 10) / 10,
    micros:     scaleMicros(e.microsPer100g, e.weightGrams),
  };
}

export function foodToEditable(food: FoodItem, grams: number): EditableIngredient {
  return {
    uid: uid(), foodId: food.id, name: food.name, nameHindi: food.nameHindi,
    weightGrams: grams,
    caloriesPer100g: food.caloriesPer100g, proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g, fatPer100g: food.fatPer100g,
    microsPer100g: food.microsPer100g,
  };
}

// ─── Full meal builder ────────────────────────────────────────────────────────

export function buildLoggedMeal(review: ReviewMeal, oilEntry?: OilEntry | null): LoggedMeal {
  const loggedIngredients = review.ingredients.map(toLoggedIngredient);
  const oil = oilEntry !== undefined ? (oilEntry ?? undefined) : review.oilEntry;

  const totalCalories = loggedIngredients.reduce((s, i) => s + i.calories, 0) + (oil?.calories ?? 0);
  const totalProteinG = loggedIngredients.reduce((s, i) => s + i.proteinG, 0);
  const totalCarbsG = loggedIngredients.reduce((s, i) => s + i.carbsG, 0);
  const totalFatG = loggedIngredients.reduce((s, i) => s + i.fatG, 0) + (oil?.fatG ?? 0);
  const micros = sumMicros(loggedIngredients.map((i) => i.micros));

  return {
    id: uid(),
    name: review.mealName || 'meal',
    mealType: review.mealType,
    ingredients: loggedIngredients,
    oilEntry: oil,
    loggedAt: new Date().toISOString(),
    dateKey: getTodayKey(),
    isCooked: review.isCooked,
    logMethod: 'ai_scan',
    totalCalories: Math.round(totalCalories),
    totalProteinG: Math.round(totalProteinG * 10) / 10,
    totalCarbsG: Math.round(totalCarbsG * 10) / 10,
    totalFatG: Math.round(totalFatG * 10) / 10,
    micros: micros ?? createZeroMicros(),
  };
}
