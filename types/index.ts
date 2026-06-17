export type Sex = "male" | "female";

// "maintain" kept for backward compat with stored profiles only — not offered in onboarding UI
export type GoalMode = "fat_loss" | "recomp" | "muscle_gain" | "maintain";

export type JobType =
  | "desk_job"
  | "light_activity"
  | "moderate_activity"
  | "heavy_labor";

export type NEATCategory = "ultra_low" | "low" | "moderate" | "active" | "very_active";

export type TrainingExperience = "beginner" | "intermediate" | "advanced";

export type UnitSystem = "metric" | "imperial";

export type DietType = "vegan" | "vegetarian" | "eggetarian" | "non_veg";

export type MeatPreference =
  | "chicken"
  | "lamb"
  | "beef"
  | "pork"
  | "fish"
  | "seafood"
  | "eggs";

export type CookingContext = "home_cooking" | "orders_out" | "mixed";

export type BudgetTier = "no_restriction" | "budget_conscious" | "supplement_friendly";

export type GoalTimeline =
  | '4_weeks' | '8_weeks' | '3_months'
  | '6_months' | '1_year' | 'no_deadline';

export interface UserProfile {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  bodyFatPercent?: number;
  experience: TrainingExperience;
  trainingDaysPerWeek: number;
  cardioFrequency: number;
  cardioDurationMin: number;
  dailySteps: number;
  sittingHoursPerDay: number;
  jobType: JobType;
  goalMode: GoalMode;
  unitSystem?: UnitSystem;
  // Dietary preferences (Phase B onboarding)
  dietType?: DietType;
  meatPreferences?: MeatPreference[];
  cookingContext?: CookingContext;
  budgetTier?: BudgetTier;
  takesSupplements?: boolean;
  supplements?: string[];
  // Goal precision (Phase B — absorbed from workout intake)
  targetWeightKg?: number;
  goalTimeline?: GoalTimeline;
  // Training context (Phase B — absorbed from workout intake)
  sessionMinutes?: number;
  cardioTypes?: string[];
  otherActivities?: string;
  // Health & safety (Phase B — absorbed from workout intake)
  healthConditions?: string[];
  healthNotes?: string;
}

export interface CalorieResult {
  bmr: number;
  maintenanceCalories: number;
  targetCalories: number;
  neatCategory: NEATCategory;
  activityMultiplier: number;
  goalMode: GoalMode;
  deficit: number; // negative = deficit, positive = surplus
}

export interface MacroResult {
  calories: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  fiberG: number;
}

export interface FullResult {
  profile: UserProfile;
  calories: CalorieResult;
  macros: MacroResult;
  hydrationMl: number;
  notes: string[];
}

export interface EvidenceCard {
  id: string;
  claim: string;
  shortExplanation: string;
  detailedExplanation: string;
  confidence: "high" | "moderate" | "emerging";
  category:
    | "calorie_estimation"
    | "protein"
    | "fat"
    | "carbs"
    | "neat"
    | "deficit"
    | "surplus"
    | "fiber"
    | "hydration"
    | "training"
    | "micronutrients"
    | "supplements"
    | "sleep"
    | "recovery"
    | "body_composition";
  citations: Citation[];
  relatedIds?: string[];
}

export interface Citation {
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  nameHindi?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  isVeg: boolean;
  budgetFriendly: boolean;
  servingExample: string;
  servingGrams: number;
  category: "protein" | "carb" | "fat" | "mixed";
}

export interface MealTemplate {
  id: string;
  name: string;
  type:
    | "high_protein_veg"
    | "high_protein_non_veg"
    | "budget"
    | "pre_workout"
    | "post_workout";
  isVeg: boolean;
  items: { foodId: string; grams: number; note?: string }[];
  totalCalories: number;
  totalProtein: number;
  description: string;
}
