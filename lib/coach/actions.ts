/**
 * Coach action protocol — typed interface between the AI model and the app.
 * The model proposes actions; the app validates and executes them.
 * Mutations NEVER fire without the user confirming.
 */

export type AllowedRoute =
  | '/(tabs)/results'
  | '/(tabs)/index'
  | '/(tabs)/workout'
  | '/(tabs)/trainer'
  | '/(tabs)/profile'
  | '/(tabs)/evidence'
  | '/log-meal'
  | '/meal-review'
  | '/plan';

export const ALLOWED_ROUTES: AllowedRoute[] = [
  '/(tabs)/results',
  '/(tabs)/index',
  '/(tabs)/workout',
  '/(tabs)/trainer',
  '/(tabs)/profile',
  '/(tabs)/evidence',
  '/log-meal',
  '/meal-review',
  '/plan',
];

export type ParsedMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';

export interface ParsedItem {
  name: string;
  estimatedWeightGrams: number;
  cookingState: 'raw' | 'cooked';
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  /** Filled by the APP via searchFoods — never by the model */
  matchedFoodId?: string;
  /** Set by app validation when no confident DB match found */
  needsReview?: boolean;
}

export interface OilHint {
  likely: boolean;
  oilType?: 'mustard' | 'sunflower' | 'coconut' | 'olive' | 'ghee' | 'butter' | 'other';
  estimatedGrams?: number;
}

export interface ParsedMeal {
  mealName: string;
  mealType: ParsedMealType;
  isCooked: boolean;
  items: ParsedItem[];
  oilHint?: OilHint;
}

// ─── Action discriminated union ───────────────────────────────────────────────

export type CoachAction =
  | NavigateAction
  | LogMealAction
  | LogMealsBatchAction
  | GenerateWorkoutAction
  | StartWorkoutAction
  | EditWorkoutAction
  | EditNotesAction
  | EditProfileAction
  | QuickLogAction
  | ManagePlanAction
  | LogWeightAction
  | LogWorkoutAction
  | LogCardioAction
  | EditMealAction
  | ManageLogAction;

export interface NavigateAction {
  kind: 'navigate';
  label: string;
  route: AllowedRoute;
}

export interface LogMealAction {
  kind: 'log_meal';
  label: string;
  meal: ParsedMeal;
}

export interface LogMealsBatchAction {
  kind: 'log_meals_batch';
  label: string;
  meals: ParsedMeal[];
}

export interface GenerateWorkoutAction {
  kind: 'generate_workout';
  label: string;
  inputs?: {
    daysPerWeek?: number;
    sessionMinutes?: number;
    weakMuscles?: string[];
    favouriteMuscles?: string[];
    healthConditions?: string[];
  };
}

export interface StartWorkoutAction {
  kind: 'start_workout';
  label: string;
  sessionName: string;
}

export interface EditWorkoutAction {
  kind: 'edit_workout';
  label: string;
  planId: string;
  op: 'swap_exercise' | 'set_active' | 'update_meta';
  patch?: Record<string, unknown>;
}

export interface EditNotesAction {
  kind: 'edit_notes';
  label: string;
  target: 'plan' | 'session' | 'log';
  id: string;
  sessionName?: string;
  exerciseName?: string;
  text: string;
}

export interface EditProfileAction {
  kind: 'edit_profile';
  label: string;
  patch: {
    goalMode?: string;
    age?: number;
    heightCm?: number;
    trainingDaysPerWeek?: number;
    dailySteps?: number;
  };
  warningMessage: string;
}

export interface QuickLogAction {
  kind: 'quick_log';
  label: string;
  /** 'water' = addWater (incremental); 'water_set' = setWater (absolute) */
  logType: 'water' | 'water_set';
  value: number;
  unit: string;
}

export interface LogWeightAction {
  kind: 'log_weight';
  label: string;
  weightKg: number;
  /** ISO date string or YYYY-MM-DD. Defaults to today. */
  date?: string;
}

export interface LogWorkoutAction {
  kind: 'log_workout';
  label: string;
  sessionName: string;
  durationMinutes?: number;
  /** 1–5 */
  feelingRating?: number;
  /** 1–5 */
  energyLevel?: number;
  notes?: string;
}

export interface LogCardioAction {
  kind: 'log_cardio';
  label: string;
  modality: string;
  minutes: number;
  avgHr?: number;
  date?: string;
}

export interface EditMealAction {
  kind: 'edit_meal';
  label: string;
  mealId: string;
  op: 'update_item' | 'add_item' | 'remove_item';
  /** Name of the ingredient to update/remove */
  itemName?: string;
  /** New weight in grams (for update_item) */
  newWeightGrams?: number;
  /** Full ingredient to add (for add_item) */
  item?: ParsedItem;
}

export interface ManageLogAction {
  kind: 'manage_log';
  label: string;
  op: 'delete_meal' | 'delete_workout';
  id: string;
}

export interface ManagePlanAction {
  kind: 'manage_plan';
  label: string;
  op: 'delete' | 'set_active';
  planId: string;
}

// ─── Full model response ──────────────────────────────────────────────────────

export interface CoachCitation {
  claim: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
}

export interface CoachVerdict {
  rating: 'legit' | 'myth' | 'depends';
  claim: string;
}

export interface CoachResponse {
  message: string;
  citations: CoachCitation[];
  actions: CoachAction[];
  followUpSuggestions: string[];
  isOffTopic: boolean;
  verdict?: CoachVerdict;
  userTranscript?: string;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  parsed?: CoachResponse;
  timestamp: string;
}
