// ─────────────────────────────────────────────────────────────────────────────
// Tapped In — Calculation Engine v2
// calorieEngine.ts — BMR, NEAT, maintenance, and goal calorie functions
// ─────────────────────────────────────────────────────────────────────────────

import type {
  UserProfile,
  BMRResult,
  NEATResult,
  NEATCategory,
  MaintenanceResult,
  GoalCaloriesResult,
} from "./types";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

/** Minimum safe daily calories to prevent dangerous recommendations */
const MIN_SAFE_KCAL_MALE = 1400;
const MIN_SAFE_KCAL_FEMALE = 1200;

// ─────────────────────────────────────────────
// INPUT SANITISATION
// ─────────────────────────────────────────────

/**
 * Clamps and validates all user inputs before any calculation.
 * Throws descriptive errors only for truly impossible values.
 * Silently clamps unrealistic-but-plausible values (e.g. 40,000 steps).
 */
export function sanitiseProfile(user: UserProfile): UserProfile {
  if (user.weight_kg < 30 || user.weight_kg > 300) {
    throw new Error(
      `Weight ${user.weight_kg}kg is outside a realistic range (30–300 kg). Please verify.`
    );
  }
  if (user.height_cm < 100 || user.height_cm > 250) {
    throw new Error(
      `Height ${user.height_cm}cm is outside a realistic range (100–250 cm). Please verify.`
    );
  }
  if (user.age < 15 || user.age > 100) {
    throw new Error(`Age ${user.age} is outside the supported range (15–100).`);
  }
  if (
    user.body_fat_percentage !== undefined &&
    (user.body_fat_percentage < 3 || user.body_fat_percentage > 60)
  ) {
    throw new Error(
      `Body fat ${user.body_fat_percentage}% is outside a realistic range (3–60%). Please verify.`
    );
  }

  return {
    ...user,
    training_days_per_week: Math.min(Math.max(0, user.training_days_per_week), 7),
    cardio_days_per_week: Math.min(Math.max(0, user.cardio_days_per_week), 7),
    cardio_minutes_per_session: Math.min(Math.max(0, user.cardio_minutes_per_session), 180),
    steps_per_day: Math.min(Math.max(0, user.steps_per_day), 25000),
    sitting_hours_per_day: Math.min(Math.max(0, user.sitting_hours_per_day), 16),
  };
}

// ─────────────────────────────────────────────
// STEP 1 — BMR (Mifflin-St Jeor)
// ─────────────────────────────────────────────

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor equation —
 * the most validated general-population formula.
 *
 * Male:   (10 × kg) + (6.25 × cm) − (5 × age) + 5
 * Female: (10 × kg) + (6.25 × cm) − (5 × age) − 161
 */
export function calculateBMR(user: UserProfile): BMRResult {
  const sexOffset = user.sex === "male" ? 5 : -161;
  const bmr = 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + sexOffset;

  return {
    bmr: Math.round(bmr),
    method_used: "mifflin_st_jeor",
    explanation_key: "bmr_msj",
  };
}

// ─────────────────────────────────────────────
// STEP 2 — NEAT Score (0–100)
// ─────────────────────────────────────────────

/**
 * Scores daily lifestyle activity from 0–100 using real behavioural signals.
 * Deliberately avoids inflated "moderately active" defaults.
 *
 * Score breakdown:
 *   Steps          0–50 pts   (primary NEAT driver)
 *   Sitting        0–20 pts   (inverted — more sitting = lower score)
 *   Structured     0–30 pts   (training + cardio together)
 */
export function calculateNEATScore(user: UserProfile): NEATResult {
  // Steps: 10,000 steps = 50 pts (max), scaled linearly below that
  const stepsScore = Math.min(50, (user.steps_per_day / 10000) * 50);

  // Sitting: 4h/day sitting = 20 pts; 12h+/day = 0 pts
  const sittingScore = Math.max(0, 20 - ((user.sitting_hours_per_day - 4) / 8) * 20);

  // Structured training: up to 15 pts (7 days/week = 15)
  const trainingScore = Math.min(15, (user.training_days_per_week / 7) * 15);

  // Cardio: weighted by frequency AND duration per session (45 min = full weight)
  const cardioScore = Math.min(
    15,
    (user.cardio_days_per_week / 7) * Math.min(1, user.cardio_minutes_per_session / 45) * 15
  );

  const score = Math.round(Math.min(100, Math.max(0, stepsScore + sittingScore + trainingScore + cardioScore)));

  let multiplier: number;
  let neat_category: NEATCategory;

  if (score <= 20) {
    multiplier = 1.2;
    neat_category = "ultra_low";
  } else if (score <= 40) {
    multiplier = 1.25;
    neat_category = "low";
  } else if (score <= 60) {
    multiplier = 1.3;
    neat_category = "moderate";
  } else if (score <= 80) {
    multiplier = 1.35;
    neat_category = "active";
  } else {
    multiplier = 1.4;
    neat_category = "very_active";
  }

  return { neat_score: score, neat_category, multiplier, explanation_key: "neat_logic" };
}

// ─────────────────────────────────────────────
// STEP 3 — Maintenance Calories
// ─────────────────────────────────────────────

/**
 * Maintenance = BMR × NEAT multiplier.
 * Returns a ±5% range to acknowledge individual metabolic variation.
 * Exercise calorie burn is NOT added separately — it is partially reflected
 * in the NEAT multiplier via training and cardio days.
 */
export function calculateMaintenance(user: UserProfile): MaintenanceResult {
  const { bmr } = calculateBMR(user);
  const { multiplier } = calculateNEATScore(user);

  const best = Math.round(bmr * multiplier);
  const low = Math.round(best * 0.95);
  const high = Math.round(best * 1.05);

  return {
    bmr,
    maintenance_low: low,
    maintenance_best: best,
    maintenance_high: high,
    explanation_key: "maintenance_logic",
  };
}

// ─────────────────────────────────────────────
// STEP 4 — Goal Calories
// ─────────────────────────────────────────────

/**
 * Applies a moderate deficit or surplus based on the user's goal.
 * deficit_preference modulates fat loss targets:
 *   mild       → −250 kcal
 *   moderate   → −400 kcal (default)
 *   aggressive → −500 kcal
 * A minimum safe intake floor is always enforced.
 */
export function calculateGoalCalories(
  user: UserProfile,
  maintenance_best: number
): GoalCaloriesResult {
  const minSafe = user.sex === "male" ? MIN_SAFE_KCAL_MALE : MIN_SAFE_KCAL_FEMALE;

  let adjustment: number;

  switch (user.goal) {
    case "fat_loss": {
      const pref = user.deficit_preference ?? "moderate";
      if (pref === "mild") adjustment = -250;
      else if (pref === "aggressive") adjustment = -500;
      else adjustment = -400; // moderate
      break;
    }
    case "recomp":
      // Small deficit — relies on adequate protein for simultaneous body recomposition
      adjustment = -175;
      break;
    case "lean_bulk":
      // Conservative surplus — minimises fat gain while supporting muscle
      adjustment = 200;
      break;
  }

  const rawTarget = maintenance_best + adjustment;
  const target_calories = Math.max(minSafe, Math.round(rawTarget));
  // Recalculate actual adjustment after floor enforcement
  const actualAdjustment = target_calories - maintenance_best;

  return {
    goal_type: user.goal,
    target_calories,
    adjustment: actualAdjustment,
    explanation_key: "goal_calories_logic",
  };
}
