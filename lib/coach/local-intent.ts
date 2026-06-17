/**
 * Confidence-gated local intent matcher.
 * Returns CoachResponse instantly (no API call) for unambiguous data lookups
 * and navigation. Returns null for everything else so the LLM handles it.
 *
 * Table-driven: each entry is { phrases, handler }. First match wins.
 */

import type { CoachContext } from './prompt';
import type { CoachResponse, AllowedRoute, CoachAction, ParsedMeal, ParsedItem } from './actions';
import { searchFoods } from '@/lib/food-utils';
import { useHydrationStore } from '@/stores/hydration-store';

function normalize(text: string): string {
  return text.toLowerCase().replace(/['']/g, "'").trim();
}

function has(text: string, phrases: string[]): boolean {
  return phrases.some(p => text.includes(p));
}

function navResponse(label: string, route: AllowedRoute): CoachResponse {
  return { message: `opening ${label} now.`, citations: [], isOffTopic: false, followUpSuggestions: [], actions: [{ kind: 'navigate', label, route }] };
}

function local(message: string, followUps: string[] = []): CoachResponse {
  return { message, citations: [], actions: [], followUpSuggestions: followUps.slice(0, 2), isOffTopic: false };
}

function withActions(message: string, actions: CoachAction[], followUps: string[] = []): CoachResponse {
  return { message, citations: [], actions, followUpSuggestions: followUps.slice(0, 2), isOffTopic: false };
}

// ─── Local water parsing (no API call) ──────────────────────────────────────

function parseWaterMl(t: string): number | null {
  const glassMl = useHydrationStore.getState().settings.glassSizeMl || 250;
  const ml = t.match(/(\d+(?:\.\d+)?)\s*ml/);
  if (ml) return Math.round(parseFloat(ml[1]));
  const litre = t.match(/(\d+(?:\.\d+)?)\s*(?:l\b|litre|liter)/);
  if (litre) return Math.round(parseFloat(litre[1]) * 1000);
  const glasses = t.match(/(\d+(?:\.\d+)?)\s*(?:glass|cup|bottle)/);
  if (glasses) return Math.round(parseFloat(glasses[1]) * glassMl);
  // "a glass of water", or a bare "log water" → one glass
  return glassMl;
}

// ─── Local meal parsing (no API call) ───────────────────────────────────────

function inferMealType(): ParsedMeal['mealType'] {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

function fragmentToItem(frag: string): ParsedItem | null {
  let qty: number | null = null;
  let unit: 'g' | 'ml' | 'count' | null = null;
  let cleaned = frag;

  const gm = frag.match(/(\d+(?:\.\d+)?)\s*(kg|g|grams?|ml)\b/);
  if (gm) {
    const n = parseFloat(gm[1]);
    qty = gm[2] === 'kg' ? n * 1000 : n;
    unit = gm[2].startsWith('ml') ? 'ml' : 'g';
    cleaned = frag.replace(gm[0], ' ');
  } else {
    const cnt = frag.match(/(\d+(?:\.\d+)?)/);
    if (cnt) { qty = parseFloat(cnt[1]); unit = 'count'; cleaned = frag.replace(cnt[0], ' '); }
    else if (/\b(a|an|one)\b/.test(frag)) { qty = 1; unit = 'count'; }
  }

  cleaned = cleaned.replace(/\b(a|an|one|some|of|bowl|bowls|plate|plates|cup|cups|piece|pieces|serving|servings|glass|small|large|medium)\b/g, ' ').trim();
  if (!cleaned) return null;

  const matches = searchFoods(cleaned, 1);
  if (matches.length === 0) return null;
  const food = matches[0];

  let grams: number;
  if (unit === 'g' && qty) grams = qty;
  else if (unit === 'ml' && qty) grams = qty; // ~1ml ≈ 1g
  else if (unit === 'count' && qty) grams = qty * food.servingGrams;
  else grams = food.servingGrams;

  return {
    name: food.name,
    estimatedWeightGrams: Math.max(1, Math.round(grams)),
    cookingState: 'cooked',
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g,
    fatPer100g: food.fatPer100g,
    matchedFoodId: food.id,
  };
}

function parseMealLocal(t: string): ParsedMeal | null {
  let mealType = inferMealType();
  let s = t;
  for (const mt of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
    if (t.includes(mt)) { mealType = mt; s = s.replace(new RegExp(`\\b(for )?${mt}\\b`, 'g'), ' '); }
  }
  // Strip command/filler words so only the food description remains.
  s = s
    .replace(/\b(please|can you|could you|just)\b/g, ' ')
    .replace(/\b(i|today|now|this morning|tonight|earlier)\b/g, ' ')
    .replace(/\b(log|logged|add|track|record|note|ate|eaten|eat|had|have)\b/g, ' ')
    .replace(/\b(my|meal)\b/g, ' ');

  const fragments = s.split(/,| and | with |\+|&/).map(f => f.trim()).filter(Boolean);
  const items: ParsedItem[] = [];
  for (const frag of fragments) {
    const item = fragmentToItem(frag);
    if (item) items.push(item);
  }
  if (items.length === 0) return null;

  return {
    mealName: items.map(i => i.name).join(', '),
    mealType,
    isCooked: true,
    items,
  };
}

// ─── Intent table ─────────────────────────────────────────────────────────────

type IntentEntry = { phrases: string[]; handler: (t: string, ctx: CoachContext) => CoachResponse | null };

const INTENTS: IntentEntry[] = [
  // ── Water logging (local — no API call) ──
  // The quick_log action auto-applies in the coach pipeline, so this logs water
  // instantly with zero Gemini usage.
  { phrases: ['water'],
    handler: (t) => {
      // Questions about water are lookups, not logs — let the water-status intent handle them.
      if (/how much|how many|left|remaining|target|goal|\?/.test(t)) return null;
      // Require a logging verb or a quantity/container so we don't log on stray mentions.
      const hasVerb = /\b(log|logged|add|added|drank|drink|drinking|had|have|track|note)\b/.test(t);
      const hasQty = /\d|glass|glasses|cup|bottle|litre|liter/.test(t);
      if (!hasVerb && !hasQty) return null;
      const ml = parseWaterMl(t);
      if (!ml || ml <= 0) return null;
      return withActions(`logged ${ml}ml of water.`, [
        { kind: 'quick_log', label: `+${ml} ml water`, logType: 'water', value: ml, unit: 'ml' },
      ]);
    },
  },

  // ── Meal logging (local — no API call) ──
  // Parses food names against the embedded catalog and proposes a log_meal the
  // user reviews. Falls through (returns null) when no food is recognised.
  { phrases: ['log ', 'i ate', 'i had', 'ate ', 'had ', 'just ate', 'just had', 'i just ate', 'i just had'],
    handler: (t) => {
      const meal = parseMealLocal(t);
      if (!meal) return null;
      const kcal = meal.items.reduce((sum, i) => sum + Math.round((i.estimatedWeightGrams / 100) * i.caloriesPer100g), 0);
      const n = meal.items.length;
      return withActions(
        `got it — ${n} item${n > 1 ? 's' : ''}, ~${kcal} kcal. tap to review and log.`,
        [{ kind: 'log_meal', label: 'review & log', meal }],
      );
    },
  },

  // Navigation
  { phrases: ['open workout', 'go to workout', 'show workout', 'go to the workout'],
    handler: () => navResponse('workout', '/(tabs)/workout') },
  { phrases: ['log a meal', 'log meal', 'add a meal', 'open food log', 'go to tracker'],
    handler: () => navResponse('log meal', '/log-meal') },
  { phrases: ['open profile', 'go to profile', 'edit profile', 'update profile'],
    handler: () => navResponse('profile', '/(tabs)/profile') },
  { phrases: ['show results', 'open results', 'see results', 'my results', 'go to results'],
    handler: () => navResponse('results', '/(tabs)/results') },

  // Protein remaining
  { phrases: ['protein left', 'protein remaining', 'how much protein', 'protein still need', 'protein needed'],
    handler: (_, ctx) => {
      const rem = Math.round(ctx.todayRemaining.proteinG);
      if (rem <= 0) return local(`protein target hit. you've had ${ctx.todayTotals.proteinG}g, target was ${ctx.targetProteinG}g.`, [`why is my protein target ${ctx.targetProteinG}g?`]);
      return local(`${rem}g protein left. target ${ctx.targetProteinG}g, eaten ${ctx.todayTotals.proteinG}g so far.`, ['suggest a meal', `why is my protein target ${ctx.targetProteinG}g?`]);
    },
  },

  // Calories remaining
  { phrases: ['calories left', 'calories remaining', 'kcal left', 'how many calories', 'calories today', 'how much left to eat'],
    handler: (_, ctx) => {
      const rem = Math.round(ctx.todayRemaining.calories);
      if (rem <= 0) return local(`calorie target hit. eaten ${ctx.todayTotals.calories} kcal, target was ${ctx.targetCalories} kcal.`, ['how is my protein today?']);
      return local(`${rem} kcal left today. target: ${ctx.targetCalories} kcal, eaten: ${ctx.todayTotals.calories} kcal.`, ['suggest a meal', 'how is my protein today?']);
    },
  },

  // Carbs remaining
  { phrases: ['carbs left', 'carbs remaining', 'how many carbs', 'carbs today'],
    handler: (_, ctx) => {
      const rem = Math.max(0, Math.round(ctx.targetCarbsG - ctx.todayTotals.carbsG));
      return local(`${rem}g carbs left. target ${ctx.targetCarbsG}g, eaten ${ctx.todayTotals.carbsG}g.`, ['how many calories left?']);
    },
  },

  // Fat remaining
  { phrases: ['fat left', 'fat remaining', 'how much fat', 'fat today'],
    handler: (_, ctx) => {
      const rem = Math.max(0, Math.round(ctx.targetFatG - ctx.todayTotals.fatG));
      return local(`${rem}g fat left. target ${ctx.targetFatG}g, eaten ${ctx.todayTotals.fatG}g.`, ['how many calories left?']);
    },
  },

  // Macro targets
  { phrases: ["what's my target", 'what are my targets', 'show my targets', 'my calorie target', 'my macro target', 'my macros'],
    handler: (_, ctx) => local(
      `targets: ${ctx.targetCalories} kcal | P:${ctx.targetProteinG}g | C:${ctx.targetCarbsG}g | F:${ctx.targetFatG}g.`,
      [`why is my protein target ${ctx.targetProteinG}g?`, 'how much have i had today?'],
    ),
  },

  // NEAT score
  { phrases: ['neat score', 'neat category', 'my neat', 'activity score', 'neat level'],
    handler: (_, ctx) => local(
      `your NEAT category is ${ctx.neatCategory.replace(/_/g, ' ')}. this drives your maintenance calories and daily targets.`,
      ['how was my neat score calculated?', 'how do i raise my neat?'],
    ),
  },

  // Maintenance / TDEE
  { phrases: ['maintenance calories', 'my maintenance', 'tdee', 'how many calories to maintain'],
    handler: (_, ctx) => {
      const maintenance = Math.round(ctx.targetCalories - ctx.deficitSurplus);
      const dir = ctx.deficitSurplus > 0 ? 'surplus' : 'deficit';
      const sign = ctx.deficitSurplus > 0 ? '+' : '';
      return local(`maintenance is ~${maintenance} kcal/day. your target is ${ctx.targetCalories} kcal (${sign}${ctx.deficitSurplus} kcal ${dir}).`, ['how was this calculated?']);
    },
  },

  // Water
  { phrases: ['how much water', 'water intake', 'water today', 'water left', 'water target', 'water goal'],
    handler: (_, ctx) => {
      const { waterMl, waterTargetMl } = ctx.micros;
      const rem = waterTargetMl - waterMl;
      if (rem <= 0) return local(`water target hit. ${waterMl}ml logged today, target is ${waterTargetMl}ml.`);
      return local(`${waterMl}ml logged, ${rem}ml to go. target: ${waterTargetMl}ml.`, ['how much water should i drink?']);
    },
  },

  // Today's meals
  { phrases: ['what did i log', 'what have i eaten', 'show my meals', "today's meals", 'meals today', 'what i ate today', 'what i logged'],
    handler: (_, ctx) => {
      if (ctx.todayMeals.length === 0) return local('nothing logged yet today.', ['log a meal', 'suggest a meal']);
      const lines = ctx.todayMeals.map(m => `${m.mealType}: ${m.name} (${m.totalCalories} kcal, P:${m.totalProteinG}g)`).join('. ');
      return local(`today: ${lines}.`, ['how much protein left?', 'how many calories left?']);
    },
  },

  // Last workout
  { phrases: ['last workout', 'how did my session', 'how was my workout', 'last session feel', 'my last workout', 'my last session'],
    handler: (_, ctx) => {
      const lf = ctx.lastWorkoutFeeling;
      if (!lf) return local('no workout sessions logged yet.', ['open workout']);
      const parts: string[] = [`last session: ${lf.sessionName} on ${lf.date}.`];
      if (lf.feelingRating  !== null) parts.push(`feeling: ${lf.feelingRating}/5.`);
      if (lf.energyLevel    !== null) parts.push(`energy: ${lf.energyLevel}/5.`);
      if (lf.sleepLastNight !== null) parts.push(`sleep: ${lf.sleepLastNight}h.`);
      if (lf.avgRpe         !== null) parts.push(`avg rpe: ${lf.avgRpe}.`);
      if (lf.notes)                   parts.push(`notes: "${lf.notes}".`);
      return local(parts.join(' '), ['why did this session feel hard?', 'what should i do next session?']);
    },
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

export function matchLocalIntent(text: string, ctx: CoachContext): CoachResponse | null {
  const t = normalize(text);
  for (const intent of INTENTS) {
    if (has(t, intent.phrases)) {
      const res = intent.handler(t, ctx);
      if (res) return res; // null → keep scanning so this query can fall to Gemini
    }
  }
  return null;
}
