// ─────────────────────────────────────────────────────────────────────────────
// Tapped In — Calculation Engine v2
// types.ts — All TypeScript interfaces and shared types
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────

export interface UserProfile {
  age: number;
  sex: "male" | "female";
  height_cm: number;
  weight_kg: number;
  /** Optional — engine will estimate if omitted */
  body_fat_percentage?: number;
  training_days_per_week: number;  // 0–7
  cardio_days_per_week: number;    // 0–7
  cardio_minutes_per_session: number;
  steps_per_day: number;
  sitting_hours_per_day: number;
  goal: "fat_loss" | "recomp" | "lean_bulk";
  diet_preference: "veg" | "non_veg";
  /**
   * How aggressive the calorie deficit should be for fat loss.
   * Defaults to "moderate" if not provided.
   * Also influences protein — aggressive cuts warrant slightly higher protein.
   */
  deficit_preference?: "mild" | "moderate" | "aggressive";
}

// ─────────────────────────────────────────────
// CALORIE ENGINE OUTPUTS
// ─────────────────────────────────────────────

export interface BMRResult {
  bmr: number;
  method_used: "mifflin_st_jeor";
  explanation_key: "bmr_msj";
}

export type NEATCategory = "ultra_low" | "low" | "moderate" | "active" | "very_active";

export interface NEATResult {
  neat_score: number;     // 0–100
  neat_category: NEATCategory;
  multiplier: number;
  explanation_key: "neat_logic";
}

export interface MaintenanceResult {
  bmr: number;
  maintenance_low: number;    // −5%
  maintenance_best: number;
  maintenance_high: number;   // +5%
  explanation_key: "maintenance_logic";
}

export interface GoalCaloriesResult {
  goal_type: "fat_loss" | "recomp" | "lean_bulk";
  target_calories: number;
  adjustment: number;   // negative = deficit, positive = surplus
  explanation_key: "goal_calories_logic";
}

// ─────────────────────────────────────────────
// MACRO ENGINE OUTPUTS
// ─────────────────────────────────────────────

export interface ProteinResult {
  protein_g: number;
  protein_g_per_kg: number;   // so callers can verify it's sane
  protein_calories: number;
  explanation_key: "protein_logic";
}

export interface FatResult {
  fat_g: number;
  fat_calories: number;
  explanation_key: "fat_logic";
}

export interface CarbResult {
  carb_g: number;
  carb_calories: number;
  explanation_key: "carb_logic";
}

export interface MacroBreakdown {
  protein_g: number;
  protein_g_per_kg: number;
  fat_g: number;
  carb_g: number;
  protein_calories: number;
  fat_calories: number;
  carb_calories: number;
  explanation_keys: {
    protein: "protein_logic";
    fat: "fat_logic";
    carbs: "carb_logic";
  };
}

// ─────────────────────────────────────────────
// NUTRITION TARGETS
// ─────────────────────────────────────────────

export interface NutritionTargets {
  fiber_g: number;
  hydration_note: string;
  electrolyte_note: string;
  explanation_key: "nutrition_logic";
}

// ─────────────────────────────────────────────
// GOAL RECOMMENDATION
// ─────────────────────────────────────────────

export interface GoalRecommendation {
  recommended_goal: "fat_loss" | "recomp" | "lean_bulk";
  reason: string;
  explanation_key: "goal_recommendation_logic";
}

// ─────────────────────────────────────────────
// PLAN META
// ─────────────────────────────────────────────

export interface PlanMeta {
  version: "v2";
  assumptions: string[];
}

// ─────────────────────────────────────────────
// FULL PLAN OUTPUT
// ─────────────────────────────────────────────

export interface NutritionPlan {
  maintenance: MaintenanceResult;
  goal: GoalCaloriesResult;
  macros: MacroBreakdown;
  nutrition: NutritionTargets;
  recommendation: GoalRecommendation;
  meta: PlanMeta;
}

// ─────────────────────────────────────────────
// EVIDENCE MAP
// ─────────────────────────────────────────────

export type EvidenceKey =
  | "bmr_msj"
  | "neat_logic"
  | "maintenance_logic"
  | "goal_calories_logic"
  | "protein_logic"
  | "fat_logic"
  | "carb_logic"
  | "nutrition_logic"
  | "goal_recommendation_logic";

export type ConfidenceLevel = "high" | "moderate" | "low";

export interface EvidenceEntry {
  title: string;
  summary: string;
  citation_placeholder: string;
  confidence: ConfidenceLevel;
}
