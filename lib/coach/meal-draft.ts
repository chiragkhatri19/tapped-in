/**
 * Converts ParsedMeal[] from the coach action into ReviewMeal[] ready for the
 * review screen. Attempts a food-DB match for each ingredient; unmatched items
 * are flagged as needsReview so the user knows to double-check.
 */

import { searchFoods } from '@/lib/food-utils';
import { foodToEditable, uid, type EditableIngredient, type ReviewMeal } from '@/lib/meal-builder';
import type { ParsedMeal } from './actions';
import type { MealType, OilEntry } from '@/data/tracker-types';
import { createZeroMicros } from '@/data/micronutrients';

const VALID_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

function makeAiIngredient(item: ParsedMeal['items'][number]): EditableIngredient {
  return {
    uid: uid(),
    foodId: 'ai_' + uid(),
    name: item.name,
    nameHindi: '',
    weightGrams: Math.max(1, Math.round(item.estimatedWeightGrams)),
    caloriesPer100g:  item.caloriesPer100g,
    proteinPer100g:   item.proteinPer100g,
    carbsPer100g:     item.carbsPer100g,
    fatPer100g:       item.fatPer100g,
    // Micros unknown when the model guessed the food
    microsPer100g: createZeroMicros(),
    needsReview: true,
  };
}

export function parsedMealsToReview(meals: ParsedMeal[]): ReviewMeal[] {
  return meals.map(pm => {
    const ingredients: EditableIngredient[] = pm.items.map(item => {
      const matches = searchFoods(item.name, 1);
      if (matches.length > 0) {
        return foodToEditable(matches[0], Math.max(1, Math.round(item.estimatedWeightGrams)));
      }
      return makeAiIngredient(item);
    });

    const mealType: MealType = VALID_MEAL_TYPES.includes(pm.mealType as MealType)
      ? (pm.mealType as MealType)
      : 'lunch';

    const oilHint = pm.oilHint
      ? {
          likely: pm.oilHint.likely,
          oilType: pm.oilHint.oilType as OilEntry['oilType'] | undefined,
          estimatedGrams: pm.oilHint.estimatedGrams,
        }
      : undefined;

    return {
      uid: uid(),
      mealName: pm.mealName || 'meal',
      mealType,
      isCooked: pm.isCooked,
      ingredients,
      oilEntry: undefined,
      oilHint,
    };
  });
}
