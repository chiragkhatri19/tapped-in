/**
 * Coach response validation.
 * Guards the app against malformed model output — drops bad actions but keeps
 * the message so the user always sees an answer.
 */

import type {
  CoachResponse, CoachAction, CoachCitation, CoachVerdict,
  NavigateAction, LogMealAction, LogMealsBatchAction,
  ParsedMeal, ParsedItem, OilHint,
  EditProfileAction, GenerateWorkoutAction,
} from './actions';
import { ALLOWED_ROUTES } from './actions';
import { sanitizeCoachMessage } from './sanitize';

// ─── Primitive guards ─────────────────────────────────────────────────────────

function isStr(v: unknown): v is string { return typeof v === 'string'; }
function isNum(v: unknown): v is number { return typeof v === 'number' && isFinite(v); }
function isBool(v: unknown): v is boolean { return typeof v === 'boolean'; }
function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// ─── Citation ─────────────────────────────────────────────────────────────────

function validateCitation(raw: unknown): CoachCitation | null {
  if (!isObj(raw)) return null;
  if (!isStr(raw.doi) || !raw.doi) return null;
  return {
    claim:   isStr(raw.claim)   ? raw.claim   : '',
    authors: isStr(raw.authors) ? raw.authors : '',
    year:    isNum(raw.year)    ? Math.round(raw.year) : 0,
    journal: isStr(raw.journal) ? raw.journal : '',
    doi:     raw.doi,
  };
}

// ─── Parsed item / meal ───────────────────────────────────────────────────────

function validateParsedItem(raw: unknown): ParsedItem | null {
  if (!isObj(raw)) return null;
  if (!isStr(raw.name) || !raw.name) return null;
  if (!isNum(raw.estimatedWeightGrams) || (raw.estimatedWeightGrams as number) <= 0) return null;
  if (!isNum(raw.caloriesPer100g)) return null;
  return {
    name:                 raw.name,
    estimatedWeightGrams: raw.estimatedWeightGrams as number,
    cookingState:         raw.cookingState === 'raw' ? 'raw' : 'cooked',
    caloriesPer100g:      raw.caloriesPer100g as number,
    proteinPer100g:       isNum(raw.proteinPer100g) ? raw.proteinPer100g as number : 0,
    carbsPer100g:         isNum(raw.carbsPer100g)   ? raw.carbsPer100g   as number : 0,
    fatPer100g:           isNum(raw.fatPer100g)     ? raw.fatPer100g     as number : 0,
  };
}

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'] as const;

function validateParsedMeal(raw: unknown): ParsedMeal | null {
  if (!isObj(raw)) return null;
  const items = Array.isArray(raw.items)
    ? (raw.items as unknown[]).map(validateParsedItem).filter((i): i is ParsedItem => i !== null)
    : [];
  if (items.length === 0) return null;
  const mealType = VALID_MEAL_TYPES.includes(raw.mealType as typeof VALID_MEAL_TYPES[number])
    ? (raw.mealType as ParsedMeal['mealType'])
    : 'lunch';
  return {
    mealName: isStr(raw.mealName) && raw.mealName ? raw.mealName : 'meal',
    mealType,
    isCooked: isBool(raw.isCooked) ? raw.isCooked : false,
    items,
    oilHint: isObj(raw.oilHint) && isBool(raw.oilHint.likely)
      ? {
          likely: raw.oilHint.likely,
          oilType: isStr(raw.oilHint.oilType) ? (raw.oilHint.oilType as OilHint['oilType']) : undefined,
          estimatedGrams: isNum(raw.oilHint.estimatedGrams) ? raw.oilHint.estimatedGrams as number : undefined,
        }
      : undefined,
  };
}

// ─── Per-action validators ────────────────────────────────────────────────────

function lbl(raw: Record<string, unknown>, fallback: string): string {
  return isStr(raw.label) ? raw.label : fallback;
}

type ActionValidator = (raw: Record<string, unknown>) => CoachAction | null;

const ACTION_VALIDATORS: Record<string, ActionValidator> = {
  navigate(raw) {
    if (!isStr(raw.route) || !(ALLOWED_ROUTES as readonly string[]).includes(raw.route)) return null;
    return { kind: 'navigate', label: lbl(raw, 'open'), route: raw.route as NavigateAction['route'] };
  },

  log_meal(raw) {
    const meal = validateParsedMeal(raw.meal);
    return meal ? { kind: 'log_meal', label: lbl(raw, 'log meal'), meal } : null;
  },

  log_meals_batch(raw) {
    if (!Array.isArray(raw.meals)) return null;
    const meals = (raw.meals as unknown[]).map(validateParsedMeal).filter((m): m is ParsedMeal => m !== null);
    return meals.length > 0 ? { kind: 'log_meals_batch', label: lbl(raw, 'review & log meals'), meals } : null;
  },

  generate_workout(raw) {
    return { kind: 'generate_workout', label: lbl(raw, 'generate workout'), inputs: isObj(raw.inputs) ? raw.inputs as GenerateWorkoutAction['inputs'] : undefined };
  },

  start_workout(raw) {
    return isStr(raw.sessionName) ? { kind: 'start_workout', label: lbl(raw, 'start workout'), sessionName: raw.sessionName } : null;
  },

  edit_workout(raw) {
    if (!isStr(raw.planId) || !isStr(raw.op)) return null;
    return { kind: 'edit_workout', label: lbl(raw, 'edit workout'), planId: raw.planId, op: raw.op as 'swap_exercise' | 'set_active' | 'update_meta', patch: isObj(raw.patch) ? raw.patch : undefined };
  },

  edit_notes(raw) {
    if (!isStr(raw.target) || !isStr(raw.id) || !isStr(raw.text)) return null;
    return { kind: 'edit_notes', label: lbl(raw, 'edit notes'), target: raw.target as 'plan' | 'session' | 'log', id: raw.id, sessionName: isStr(raw.sessionName) ? raw.sessionName : undefined, exerciseName: isStr(raw.exerciseName) ? raw.exerciseName : undefined, text: raw.text };
  },

  edit_profile(raw) {
    if (!isObj(raw.patch)) return null;
    return { kind: 'edit_profile', label: lbl(raw, 'edit profile'), patch: raw.patch as EditProfileAction['patch'], warningMessage: isStr(raw.warningMessage) ? raw.warningMessage : 'this will update your profile and recalculate your targets.' };
  },

  quick_log(raw) {
    if (!isNum(raw.value)) return null;
    if (raw.logType !== 'water' && raw.logType !== 'water_set') return null;
    return { kind: 'quick_log', label: lbl(raw, 'log'), logType: raw.logType as 'water' | 'water_set', value: raw.value as number, unit: isStr(raw.unit) ? raw.unit : 'ml' };
  },

  manage_plan(raw) {
    if (!isStr(raw.planId) || !isStr(raw.op)) return null;
    return { kind: 'manage_plan', label: lbl(raw, 'manage plan'), op: raw.op as 'delete' | 'set_active', planId: raw.planId };
  },

  log_weight(raw) {
    if (!isNum(raw.weightKg)) return null;
    return { kind: 'log_weight', label: lbl(raw, 'log weight'), weightKg: raw.weightKg as number, date: isStr(raw.date) ? raw.date : undefined };
  },

  log_workout(raw) {
    if (!isStr(raw.sessionName)) return null;
    return {
      kind: 'log_workout', label: lbl(raw, 'log workout'), sessionName: raw.sessionName,
      durationMinutes: isNum(raw.durationMinutes) ? raw.durationMinutes as number : undefined,
      feelingRating: isNum(raw.feelingRating) ? raw.feelingRating as number : undefined,
      energyLevel: isNum(raw.energyLevel) ? raw.energyLevel as number : undefined,
      notes: isStr(raw.notes) ? raw.notes : undefined,
    };
  },

  log_cardio(raw) {
    if (!isStr(raw.modality) || !isNum(raw.minutes)) return null;
    return { kind: 'log_cardio', label: lbl(raw, 'log cardio'), modality: raw.modality, minutes: raw.minutes as number, avgHr: isNum(raw.avgHr) ? raw.avgHr as number : undefined, date: isStr(raw.date) ? raw.date : undefined };
  },

  edit_meal(raw) {
    if (!isStr(raw.mealId) || !isStr(raw.op)) return null;
    return { kind: 'edit_meal', label: lbl(raw, 'edit meal'), mealId: raw.mealId, op: raw.op as 'update_item' | 'add_item' | 'remove_item', itemName: isStr(raw.itemName) ? raw.itemName : undefined, newWeightGrams: isNum(raw.newWeightGrams) ? raw.newWeightGrams as number : undefined };
  },

  manage_log(raw) {
    if (!isStr(raw.op) || !isStr(raw.id)) return null;
    return { kind: 'manage_log', label: lbl(raw, 'delete'), op: raw.op as 'delete_meal' | 'delete_workout', id: raw.id };
  },
};

function validateAction(raw: unknown): CoachAction | null {
  if (!isObj(raw) || !isStr(raw.kind)) return null;
  const validator = ACTION_VALIDATORS[raw.kind];
  return validator ? validator(raw) : null;
}

// ─── Verdict ─────────────────────────────────────────────────────────────────

const VALID_RATINGS = ['legit', 'myth', 'depends'] as const;

function validateVerdict(raw: unknown): CoachVerdict | undefined {
  if (!isObj(raw)) return undefined;
  if (!isStr(raw.rating) || !(VALID_RATINGS as readonly string[]).includes(raw.rating)) return undefined;
  if (!isStr(raw.claim) || !raw.claim) return undefined;
  return { rating: raw.rating as CoachVerdict['rating'], claim: raw.claim };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/** Parse raw model output into a validated CoachResponse. On failure, returns a degraded response with the raw text. */
export function parseCoachResponse(raw: unknown): CoachResponse {
  const fallback: CoachResponse = {
    message: typeof raw === 'string' ? sanitizeCoachMessage(raw) : 'something went wrong. try again.',
    citations: [],
    actions: [],
    followUpSuggestions: [],
    isOffTopic: false,
  };

  if (!isObj(raw)) return fallback;

  const message = sanitizeCoachMessage(isStr(raw.message) && raw.message ? raw.message : fallback.message);
  const isOffTopic = isBool(raw.isOffTopic) ? raw.isOffTopic : false;

  const citations: CoachCitation[] = Array.isArray(raw.citations)
    ? (raw.citations as unknown[]).map(validateCitation).filter((c): c is CoachCitation => c !== null)
    : [];

  const actions: CoachAction[] = Array.isArray(raw.actions)
    ? (raw.actions as unknown[]).map(validateAction).filter((a): a is CoachAction => a !== null).slice(0, 2)
    : [];

  const followUpSuggestions: string[] = Array.isArray(raw.followUpSuggestions)
    ? (raw.followUpSuggestions as unknown[]).filter(isStr).slice(0, 2)
    : [];

  const verdict = validateVerdict(raw.verdict);
  const userTranscript = isStr(raw.userTranscript) && raw.userTranscript ? raw.userTranscript : undefined;

  return { message, citations, actions, followUpSuggestions, isOffTopic, verdict, userTranscript };
}
