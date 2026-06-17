import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import type {
  ScanMealRequest, ScanMealResponse,
  GenerateWorkoutRequest, WorkoutSkeleton,
} from '@shared/types/api';
import { WORKOUT_PROMPT } from '@shared/prompts/workout';
import { COACH_RESPONSE_SCHEMA } from '@shared/schemas/coach';

// Supports multiple keys for free-tier quota failover. Set GEMINI_API_KEYS to a
// comma-separated list (e.g. KEY1,KEY2,KEY3); a single GEMINI_API_KEY still works.
// These live ONLY on the server — never ship a Gemini key in the mobile app.
const GEMINI_KEYS = (process.env.GEMINI_API_KEYS ?? process.env.GEMINI_API_KEY ?? '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

if (GEMINI_KEYS.length === 0) {
  throw new Error('Missing GEMINI_API_KEYS (or GEMINI_API_KEY) env var');
}

// Errors that mean "this key is exhausted/bad — try the next one".
const ROTATE_RE = /\b429\b|\b403\b|quota|RESOURCE_EXHAUSTED|exhausted|api[_ ]?key|invalid|expired|permission/i;

// Sticky index — keep using the last good key until it fails.
let _keyIdx = 0;

/**
 * Run `fn` with each configured key, starting from the last good one. Rotates to
 * the next key on quota/auth errors; for any other error (malformed JSON, empty
 * response, network) it fails fast rather than burning all keys.
 */
async function withGeminiKey<T>(fn: (key: string) => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const idx = (_keyIdx + i) % GEMINI_KEYS.length;
    try {
      const result = await fn(GEMINI_KEYS[idx]);
      _keyIdx = idx; // stick with the working key next time
      return result;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!ROTATE_RE.test(msg)) throw err; // not a key problem — don't waste other keys
      console.warn(`[gemini] key #${idx + 1}/${GEMINI_KEYS.length} exhausted, rotating`);
    }
  }
  throw lastErr ?? new Error('all Gemini keys failed');
}

const ScanResponseSchema = z.object({
  dishName: z.string().max(200).default(''),
  ingredients: z.array(z.object({
    foodId: z.string().max(100).optional(),
    name: z.string().max(200),
    weightGrams: z.number().min(0).max(5000),
    calories: z.number().min(0).max(5000),
    proteinG: z.number().min(0).max(500),
    carbsG: z.number().min(0).max(500),
    fatG: z.number().min(0).max(500),
  })).max(30).default([]),
  overallConfidence: z.enum(['high', 'medium', 'low']).default('medium'),
  notes: z.string().max(500).nullable().default(null),
});

const SCAN_PROMPT = `You are a nutrition analyst. Analyze this food image and return ONLY valid JSON.

Rules:
- List each ingredient separately with estimated weight in grams
- NEVER include oil, ghee, or butter in ingredients[] — mention in notes only
- Estimate raw weight unless the dish is clearly pre-packaged with label
- confidence: "high" if dish is clearly identifiable, "medium" if uncertain, "low" if very unclear

Return this exact JSON schema:
{
  "dishName": "string",
  "ingredients": [
    { "foodId": "generic_id", "name": "string", "weightGrams": number, "calories": number, "proteinG": number, "carbsG": number, "fatG": number }
  ],
  "overallConfidence": "high" | "medium" | "low",
  "notes": "string or null — mention potential oil/ghee/butter here"
}`;

export async function scanMealImage(req: ScanMealRequest): Promise<ScanMealResponse> {
  return withGeminiKey(async (key) => {
    const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      SCAN_PROMPT,
      `Cooking state: ${req.isCooked ? 'cooked dish' : 'raw ingredients'}`,
      { inlineData: { mimeType: req.mimeType, data: req.imageBase64 } },
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Gemini returned no JSON');

    const raw = JSON.parse(jsonMatch[0]);
    const validated = ScanResponseSchema.parse(raw);
    return validated as unknown as ScanMealResponse;
  });
}

// --- Workout generation -------------------------------------------------------
// Returns a thin skeleton; the mobile client hydrates the full plan from its
// exercise DB. JSON mode + a generous token ceiling avoid the truncated-output
// parse errors ("expecting a string key") seen on the old client-side path.
const WORKOUT_GENERATION_CONFIG = {
  temperature: 0.2,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
} as const;

// WORKOUT_PROMPT is imported from shared/prompts/workout.ts above.

// Repair a JSON object that was truncated at the token ceiling: trim to the last
// complete value, drop dangling commas, then close any still-open structures.
function repairTruncatedJSON(input: string): string {
  const start = input.indexOf('{');
  const s = start === -1 ? input : input.slice(start);
  let inStr = false, escaped = false, lastSafe = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') { inStr = false; lastSafe = i + 1; }
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{' || ch === '[') continue;
    if (ch === '}' || ch === ']') { lastSafe = i + 1; continue; }
    if ((ch >= '0' && ch <= '9') || ch === 'e') lastSafe = i + 1;
  }
  let out = (lastSafe > 0 ? s.slice(0, lastSafe) : s).replace(/[\s,]*$/, '');
  const closers: string[] = [];
  let inS = false, esc = false;
  for (const ch of out) {
    if (inS) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inS = false; continue; }
    if (ch === '"') inS = true;
    else if (ch === '{') closers.push('}');
    else if (ch === '[') closers.push(']');
    else if (ch === '}' || ch === ']') closers.pop();
  }
  return out + closers.reverse().join('');
}

function parseModelJSON(raw: string): unknown {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
  }
  if (start !== -1) {
    try { return JSON.parse(repairTruncatedJSON(cleaned)); } catch { /* fall through */ }
  }
  throw new Error('Model returned malformed JSON');
}

// Strip characters that can escape a prompt substitution slot: newlines,
// backticks (markdown code fences), and angle brackets (XML-style tags).
function sanitizePromptSlot(s: string): string {
  return s.replace(/[\n\r`<>]/g, ' ').trim();
}

export async function generateWorkoutSkeleton(req: GenerateWorkoutRequest): Promise<WorkoutSkeleton> {
  const i = req.inputs;
  // Array fields are JSON-stringified so their values are opaque to the model
  // instruction parser rather than being interpreted as inline text.
  const prompt = WORKOUT_PROMPT
    .replace('{goal}', sanitizePromptSlot(i.goal))
    .replace('{sex}', sanitizePromptSlot(i.sex))
    .replace('{age}', String(i.age))
    .replace('{weightKg}', String(i.weightKg))
    .replace('{daysPerWeek}', String(i.daysPerWeek))
    .replace('{sessionMinutes}', String(i.sessionMinutes))
    .replace('{weakMuscles}', JSON.stringify(i.weakMuscles ?? []))
    .replace('{favouriteMuscles}', JSON.stringify(i.favouriteMuscles ?? []))
    .replace('{healthConditions}', JSON.stringify(i.healthConditions ?? []))
    .replace('{exerciseMenu}', sanitizePromptSlot(req.exerciseMenu));

  return withGeminiKey(async (key) => {
    const workoutModel = new GoogleGenerativeAI(key).getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: WORKOUT_GENERATION_CONFIG,
    });
    const result = await workoutModel.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error('Gemini returned an empty plan');

    const skeleton = parseModelJSON(text) as WorkoutSkeleton;
    if (!Array.isArray(skeleton?.sessions) || skeleton.sessions.length === 0) {
      throw new Error('Gemini returned a plan with no sessions');
    }
    return skeleton;
  });
}

// ─── Coach (raw fetch — uses systemInstruction for implicit caching) ──────────

const COACH_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'] as const;
const COACH_TIMEOUT_MS = 25_000;

interface CoachCallRequest {
  userMessage: string;
  history: Array<{ role: string; text: string }>;
  staticInstruction: string;
  dynamicContext: string;
}

export async function callCoachGemini(req: CoachCallRequest): Promise<unknown> {
  // Rotate keys on quota/auth errors; coachWithKey handles transient
  // (5xx/timeout/MAX_TOKENS) retries with a model fallback on the same key.
  return withGeminiKey((key) => coachWithKey(req, key));
}

async function coachWithKey(req: CoachCallRequest, apiKey: string, attempt = 0): Promise<unknown> {
  const model = COACH_MODELS[Math.min(attempt, COACH_MODELS.length - 1)];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COACH_TIMEOUT_MS);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contents: any[] = [
    { role: 'user',  parts: [{ text: req.dynamicContext + '\n\nAcknowledge. Reply only: {"ready":true}' }] },
    { role: 'model', parts: [{ text: '{"ready":true}' }] },
    ...req.history.slice(-16).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: req.userMessage }] },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generationConfig: Record<string, any> = {
    temperature: 0.3,
    maxOutputTokens: 1024,
    responseMimeType: 'application/json',
    responseSchema: COACH_RESPONSE_SCHEMA,
    thinkingConfig: { thinkingBudget: 0 },
  };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: req.staticInstruction }] },
          generationConfig,
        }),
      }
    );
    clearTimeout(timer);

    if (!res.ok) {
      const t = await res.text();
      // 5xx → transient; retry once on the alt model with the SAME key.
      // 429/quota → let it throw so withGeminiKey rotates to the next key.
      if (attempt === 0 && res.status >= 500) {
        return coachWithKey(req, apiKey, 1);
      }
      throw new Error(`Gemini ${res.status}: ${t.slice(0, 200)}`);
    }

    const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> };
    const candidate = data?.candidates?.[0];
    const raw: string = candidate?.content?.parts?.[0]?.text ?? '';

    if (candidate?.finishReason === 'MAX_TOKENS' && attempt === 0) {
      return coachWithKey(req, apiKey, 1);
    }

    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err: unknown) {
    clearTimeout(timer);
    if ((err as { name?: string })?.name === 'AbortError' && attempt === 0) {
      return coachWithKey(req, apiKey, 1);
    }
    throw err;
  }
}
