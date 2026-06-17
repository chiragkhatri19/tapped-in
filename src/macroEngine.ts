// ─────────────────────────────────────────────────────────────────────────────
// Tapped In — Calculation Engine v2
// macroEngine.ts — Protein, fat, and carbohydrate targets
//
// IMPORTANT DESIGN PRINCIPLE:
// Protein targets are NOT inflated by default.
// The default is 1.6–1.7 g/kg for most goals.
// Only fat loss with a larger deficit warrants modest increases (1.7–1.8 g/kg).
// Evidence does not support routinely recommending 2.0–2.2 g/kg for most users.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  UserProfile,
  ProteinResult,
  FatResult,
  CarbResult,
  MacroBreakdown,
} from "./types";

const KCAL_PER_PROTEIN = 4;
const KCAL_PER_CARB = 4;
const KCAL_PER_FAT = 9;

// ─────────────────────────────────────────────
// PROTEIN
// ─────────────────────────────────────────────

/**
 * Calculates a conservative, evidence-based protein target.
 *
 * Rules:
 * - Recomp / lean bulk: 1.6 g/kg (base — sufficient for MPS in most trained individuals)
 * - Fat loss (mild/moderate deficit): 1.7 g/kg (modest increase to protect muscle)
 * - Fat loss (aggressive deficit): 1.8 g/kg (higher to offset catabolism risk)
 *
 * Hard cap at 2.0 g/kg — outputs above this are not meaningfully supported by evidence
 * for non-elite populations and inflate the diet unnecessarily.
 *
 * A floor of 100g absolute is maintained for very light users.
 */
export function calculateProteinTarget(
  user: UserProfile,
  _target_calories: number
): ProteinResult {
  let multiplier: number;

  if (user.goal === "fat_loss") {
    const pref = user.deficit_preference ?? "moderate";
    if (pref === "aggressive") {
      // Larger deficit increases muscle catabolism risk → slightly higher protein justified
      multiplier = 1.8;
    } else {
      // Mild or moderate deficit — 1.7 is sufficient
      multiplier = 1.7;
    }
  } else {
    // Recomp or lean bulk: 1.6 g/kg is well-supported and avoids unnecessary inflation
    multiplier = 1.6;
  }

  // Cap at 2.0 g/kg — evidence ceiling for most populations
  const MAX_MULTIPLIER = 2.0;
  const effectiveMultiplier = Math.min(multiplier, MAX_MULTIPLIER);

  const rawProtein = effectiveMultiplier * user.weight_kg;
  // Floor of 100g for very light users
  const protein_g = Math.round(Math.max(100, rawProtein));
  const protein_g_per_kg = parseFloat((protein_g / user.weight_kg).toFixed(2));
  const protein_calories = protein_g * KCAL_PER_PROTEIN;

  return {
    protein_g,
    protein_g_per_kg,
    protein_calories,
    explanation_key: "protein_logic",
  };
}

// ─────────────────────────────────────────────
// FAT
// ─────────────────────────────────────────────

/**
 * Calculates dietary fat target.
 *
 * Rules:
 * - Minimum: greater of 0.6 g/kg or 60g absolute (to protect hormonal health)
 * - After the minimum is set, fat is not inflated beyond what's needed
 * - Fat is kept practical so carbohydrates remain adequate for training fuel
 *
 * We do NOT push fat high unless there are very few calories left for carbs —
 * the goal is to keep carbs functional, not to maximise fat.
 */
export function calculateFatTarget(
  user: UserProfile,
  target_calories: number,
  protein_g: number
): FatResult {
  // Minimum fat based on body weight, with an absolute floor
  const fat_g = Math.round(Math.max(0.6 * user.weight_kg, 60));
  const fat_calories = fat_g * KCAL_PER_FAT;

  // Safety check: if protein + fat already exceeds target calories, something is wrong
  const protein_calories = protein_g * KCAL_PER_PROTEIN;
  if (protein_calories + fat_calories > target_calories) {
    // Reduce fat to leave at least 0 calories for carbs (floor case)
    const available = Math.max(0, target_calories - protein_calories);
    const adjusted_fat_g = Math.round(Math.max(30, available / KCAL_PER_FAT));
    return {
      fat_g: adjusted_fat_g,
      fat_calories: adjusted_fat_g * KCAL_PER_FAT,
      explanation_key: "fat_logic",
    };
  }

  return { fat_g, fat_calories, explanation_key: "fat_logic" };
}

// ─────────────────────────────────────────────
// CARBOHYDRATES
// ─────────────────────────────────────────────

/**
 * Calculates carbohydrate target from remaining calories after protein and fat.
 * Carbs are the flexible macro — they absorb any calorie adjustments.
 * This keeps protein and fat stable regardless of calorie level.
 *
 * Result is floored at 0 (some very low-calorie situations may leave no room).
 */
export function calculateCarbTarget(
  target_calories: number,
  protein_g: number,
  fat_g: number
): CarbResult {
  const allocated = protein_g * KCAL_PER_PROTEIN + fat_g * KCAL_PER_FAT;
  const remaining = Math.max(0, target_calories - allocated);
  const carb_g = Math.round(remaining / KCAL_PER_CARB);
  const carb_calories = carb_g * KCAL_PER_CARB;

  return { carb_g, carb_calories, explanation_key: "carb_logic" };
}

// ─────────────────────────────────────────────
// COMBINED MACRO BREAKDOWN
// ─────────────────────────────────────────────

/**
 * Convenience function that runs all three macro calculations and returns
 * a single combined MacroBreakdown object.
 */
export function calculateMacros(
  user: UserProfile,
  target_calories: number
): MacroBreakdown {
  const proteinResult = calculateProteinTarget(user, target_calories);
  const fatResult = calculateFatTarget(user, target_calories, proteinResult.protein_g);
  const carbResult = calculateCarbTarget(target_calories, proteinResult.protein_g, fatResult.fat_g);

  return {
    protein_g: proteinResult.protein_g,
    protein_g_per_kg: proteinResult.protein_g_per_kg,
    fat_g: fatResult.fat_g,
    carb_g: carbResult.carb_g,
    protein_calories: proteinResult.protein_calories,
    fat_calories: fatResult.fat_calories,
    carb_calories: carbResult.carb_calories,
    explanation_keys: {
      protein: "protein_logic",
      fat: "fat_logic",
      carbs: "carb_logic",
    },
  };
}
