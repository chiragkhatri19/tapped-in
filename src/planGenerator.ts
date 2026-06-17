// ─────────────────────────────────────────────────────────────────────────────
// Tapped In — Calculation Engine v2
// planGenerator.ts — Master function that orchestrates the full pipeline
// ─────────────────────────────────────────────────────────────────────────────

import type { UserProfile, NutritionPlan } from "./types";
import { sanitiseProfile, calculateBMR, calculateNEATScore, calculateMaintenance, calculateGoalCalories } from "./calorieEngine";
import { calculateMacros } from "./macroEngine";
import { calculateNutritionTargets, recommendGoal } from "./nutritionTargets";

/**
 * Master function — runs the complete pipeline and returns a single
 * structured plan object ready to consume in the React Native app.
 *
 * Steps:
 *  1. Sanitise + validate inputs
 *  2. BMR (Mifflin-St Jeor)
 *  3. NEAT score → activity multiplier
 *  4. Maintenance range (±5%)
 *  5. Goal calorie adjustment
 *  6. Macros (protein → fat → carbs)
 *  7. Fiber / hydration / electrolytes
 *  8. Goal recommendation
 *  9. Meta + assumptions
 */
export function generatePlan(rawUser: UserProfile): NutritionPlan {
  const user = sanitiseProfile(rawUser);

  const bmrResult = calculateBMR(user);
  const neatResult = calculateNEATScore(user);
  const maintenance = calculateMaintenance(user);
  const goal = calculateGoalCalories(user, maintenance.maintenance_best);
  const macros = calculateMacros(user, goal.target_calories);
  const nutrition = calculateNutritionTargets(user, goal.target_calories);
  const recommendation = recommendGoal(user);

  const assumptions: string[] = [
    `BMR calculated using Mifflin-St Jeor (${bmrResult.bmr} kcal).`,
    `NEAT score: ${neatResult.neat_score}/100 → category: ${neatResult.neat_category} → multiplier: ${neatResult.multiplier}×.`,
    `Maintenance range is ±5% around ${maintenance.maintenance_best} kcal to reflect individual metabolic variation.`,
    user.body_fat_percentage === undefined
      ? "Body fat percentage was not provided — goal recommendation uses an age/sex-based estimate."
      : `Body fat percentage of ${user.body_fat_percentage}% was provided by the user.`,
    `Protein set at ${macros.protein_g_per_kg} g/kg (${macros.protein_g}g). ` +
      `Default is conservative (1.6–1.7 g/kg); increased modestly for fat loss or aggressive deficits.`,
    `Minimum safe daily intake enforced at ${user.sex === "male" ? 1400 : 1200} kcal.`,
    "Exercise calorie burn is NOT added to maintenance — it is partially captured in the NEAT multiplier.",
    "These numbers are a starting estimate. Adjust after 2–3 weeks of tracking weekly weight trends.",
  ];

  return {
    maintenance,
    goal,
    macros,
    nutrition,
    recommendation,
    meta: {
      version: "v2",
      assumptions,
    },
  };
}
