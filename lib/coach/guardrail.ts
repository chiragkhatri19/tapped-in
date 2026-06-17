/**
 * Confidence-gated local guardrail.
 * Runs before any API call — zero network cost.
 *
 * Strategy (mirrors matchLocalIntent style):
 *  - NSFW / abuse: hard block on clear signals
 *  - Obvious off-topic: block only when a non-fitness domain matches AND
 *    no fitness/nutrition term is present (avoids false positives like
 *    "what's the best crypto for... my workout nutrition?" — unlikely but real)
 *  - Uncertain → return null → let the LLM decide (still backstopped by isOffTopic)
 */

import type { CoachResponse } from './actions';

function norm(t: string): string {
  return t.toLowerCase().replace(/['']/g, "'").trim();
}

function has(t: string, terms: string[]): boolean {
  return terms.some(w => t.includes(w));
}

function blocked(message: string): CoachResponse {
  return { message, citations: [], actions: [], followUpSuggestions: [], isOffTopic: true };
}

// ─── NSFW / abuse blocklist ────────────────────────────────────────────────────
// Explicit sexual content, slurs, graphic violence. Word-boundary sensitive.
const NSFW_PATTERNS: RegExp[] = [
  /\bporn(ography)?\b/,
  /\bxxx\b/,
  /\bnude\b/,
  /\bnaked\b/,
  /\bsex(ual)?\s+position\b/,
  /\bfuck\s+(me|you|her|him|them)\b/,
  /\bwank\b/,
  /\bmasturbat/,
  /\bkill\s+(yourself|myself|himself|herself)\b/,
  /\bsuicid(e|al)\b/,
  /\bself[-\s]?harm\b/,
];

// ─── Off-topic domain keywords ─────────────────────────────────────────────────
// Block only when clearly in one of these domains.
const OFFTOPIC_DOMAINS: Array<{ domain: RegExp[]; label: string }> = [
  {
    label: 'politics',
    domain: [/\belection\b/, /\bvote\b/, /\bpolitics?\b/, /\bpresident\b/, /\bcongresss?\b/, /\bparliament\b/, /\bparty\s+(politics|member|leader)\b/],
  },
  {
    label: 'coding',
    domain: [/\bpython\b/, /\bjavascript\b/, /\btypescript\b/, /\bcode\b/, /\bprogramm(ing|er)\b/, /\bdebugg(ing|er)\b/, /\bfunction\s*\(/],
  },
  {
    label: 'finance',
    domain: [/\bstock\s+market\b/, /\bcrypto(currency)?\b/, /\bbitcoin\b/, /\bnft\b/, /\bmortgage\b/, /\binvest(ing|ment|ments)\b/, /\btax\s+return\b/],
  },
  {
    label: 'relationships',
    domain: [/\bmy\s+crush\b/, /\bmy\s+girlfriend\b/, /\bmy\s+boyfriend\b/, /\bbreakup\b/, /\bdate\s+(me|her|him|them)\b/, /\bdating\s+app\b/],
  },
  {
    label: 'weather',
    domain: [/\bweather\s+(today|tomorrow|forecast)\b/, /\bwhat.{0,5}temperature\s+(outside|today)\b/],
  },
  {
    label: 'homework',
    domain: [/\bwrite\s+an?\s+essay\b/, /\bdo\s+my\s+homework\b/, /\bsummarise\s+this\s+(book|chapter|article)\b/, /\btranslat(e|ion)\s+(this|the)\b/],
  },
];

// Fitness / nutrition lexicon — if these are present, we don't block even if an off-topic domain matched
const FITNESS_TERMS = [
  'calorie', 'protein', 'carb', 'fat', 'workout', 'exercise', 'gym', 'diet', 'macro',
  'muscle', 'weight', 'run', 'cardio', 'sleep', 'recover', 'bulk', 'cut', 'lean',
  'creatine', 'meal', 'food', 'nutrition', 'training', 'lift', 'squat', 'bench', 'deadlift',
  'walk', 'steps', 'neat', 'bmr', 'tdee', 'deficit', 'surplus', 'bmi', 'body fat',
  'iron', 'calcium', 'vitamin', 'supplement', 'whey', 'casein', 'pre-workout',
];

export function checkGuardrail(text: string): CoachResponse | null {
  const t = norm(text);

  // Hard block NSFW / self-harm
  for (const pattern of NSFW_PATTERNS) {
    if (pattern.test(t)) {
      return blocked("i keep it strictly to fitness and nutrition. anything i can help with there?");
    }
  }

  // Off-topic block — only when no fitness term is present
  const hasFitnessContext = has(t, FITNESS_TERMS);
  if (!hasFitnessContext) {
    for (const { domain } of OFFTOPIC_DOMAINS) {
      if (domain.some(rx => rx.test(t))) {
        return blocked("that's outside my wheelhouse. i'm all fitness and nutrition. anything i can help with there?");
      }
    }
  }

  return null;
}
