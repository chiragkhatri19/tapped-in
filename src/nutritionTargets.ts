// ─────────────────────────────────────────────────────────────────────────────
// Tapped In — Calculation Engine v2
// nutritionTargets.ts — Fiber, hydration, and electrolyte guidance
// ─────────────────────────────────────────────────────────────────────────────

import type { UserProfile, NutritionTargets, GoalRecommendation } from "./types";

// ─────────────────────────────────────────────
// FIBER, HYDRATION, ELECTROLYTES
// ─────────────────────────────────────────────

/**
 * Returns practical, calorie-scaled nutrition targets.
 *
 * Fiber: 10–15g per 1000 kcal (midpoint ≈ 12.5g/1000 kcal)
 * Hydration: 35ml/kg/day baseline, minimum 2L
 * Electrolytes: qualitative guidance — especially important on lower-calorie diets
 */
export function calculateNutritionTargets(
  user: UserProfile,
  target_calories: number
): NutritionTargets {
  // Fiber: scale from calories using 12.5g per 1000 kcal midpoint
  const fiber_g = Math.round((12.5 / 1000) * target_calories);

  // Hydration: 35ml per kg body weight, minimum 2L
  const hydration_ml = Math.max(2000, Math.round(35 * user.weight_kg));
  const hydration_L = (hydration_ml / 1000).toFixed(1);
  const hydration_note =
    `Aim for approximately ${hydration_L}L of water per day ` +
    `(${user.weight_kg}kg × 35ml/kg). Add an extra 400–600ml on training days ` +
    `or in hot weather.`;

  const electrolyte_note =
    "Electrolytes — especially sodium, potassium, and magnesium — often drop on " +
    "lower-calorie diets and can cause fatigue, cramps, and poor focus. " +
    "Prioritise mineral-rich foods: leafy greens, legumes, dairy or dairy alternatives, " +
    "and lightly salted whole foods. If you train hard and sweat heavily, " +
    "consider an electrolyte supplement without excess sugar.";

  return {
    fiber_g,
    hydration_note,
    electrolyte_note,
    explanation_key: "nutrition_logic",
  };
}

// ─────────────────────────────────────────────
// GOAL RECOMMENDATION
// ─────────────────────────────────────────────

/**
 * Recommends the most appropriate goal based on estimated body fat percentage.
 * If body_fat_percentage is not provided, a conservative estimate is derived
 * from age and sex. Thresholds are based on general health and physique norms.
 */
export function recommendGoal(user: UserProfile): GoalRecommendation {
  // Estimate body fat if not provided
  const bf =
    user.body_fat_percentage ??
    (user.sex === "male"
      ? Math.min(28, 10 + user.age * 0.15)
      : Math.min(38, 18 + user.age * 0.12));

  // Thresholds differ by sex — female physiology carries more essential fat
  const highBF = user.sex === "male" ? 22 : 32;
  const leanBF = user.sex === "male" ? 15 : 24;

  let recommended_goal: "fat_loss" | "recomp" | "lean_bulk";
  let reason: string;

  if (bf >= highBF) {
    recommended_goal = "fat_loss";
    reason =
      `At an estimated ${bf.toFixed(1)}% body fat, a fat loss phase will produce ` +
      `the most visible physique changes and improve key health markers ` +
      `(insulin sensitivity, blood pressure, cardiovascular risk).`;
  } else if (bf >= leanBF) {
    recommended_goal = "recomp";
    reason =
      `At ${bf.toFixed(1)}% body fat you're in the optimal range for body recomposition — ` +
      `gradually reducing fat while maintaining or modestly increasing muscle mass. ` +
      `This approach is slower but sustainable and avoids unnecessary bulk-cut cycles.`;
  } else {
    recommended_goal = "lean_bulk";
    reason =
      `At ${bf.toFixed(1)}% body fat you're already lean. ` +
      `A controlled calorie surplus will support quality muscle gain with minimal fat accumulation. ` +
      `Lean individuals have more room to eat above maintenance before fat gain becomes problematic.`;
  }

  return {
    recommended_goal,
    reason,
    explanation_key: "goal_recommendation_logic",
  };
}
