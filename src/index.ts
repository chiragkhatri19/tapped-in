// ─────────────────────────────────────────────────────────────────────────────
// Tapped In — Calculation Engine v2
// index.ts — Public API surface. Import everything from here.
// ─────────────────────────────────────────────────────────────────────────────

// Types
export type {
  UserProfile,
  BMRResult,
  NEATResult,
  NEATCategory,
  MaintenanceResult,
  GoalCaloriesResult,
  ProteinResult,
  FatResult,
  CarbResult,
  MacroBreakdown,
  NutritionTargets,
  GoalRecommendation,
  NutritionPlan,
  PlanMeta,
  EvidenceEntry,
  EvidenceKey,
  ConfidenceLevel,
} from "./types";

// Calorie engine
export {
  sanitiseProfile,
  calculateBMR,
  calculateNEATScore,
  calculateMaintenance,
  calculateGoalCalories,
} from "./calorieEngine";

// Macro engine
export {
  calculateProteinTarget,
  calculateFatTarget,
  calculateCarbTarget,
  calculateMacros,
} from "./macroEngine";

// Nutrition targets + goal recommendation
export {
  calculateNutritionTargets,
  recommendGoal,
} from "./nutritionTargets";

// Evidence map
export { EvidenceMap } from "./evidenceMap";

// Master plan generator
export { generatePlan } from "./planGenerator";
