# AI & Data Tech Stack — Tapped In

> How the LLM, storage, schemas, and Supabase actually fit together.
> Every section ends with **"Why this, not that"** — the alternatives we considered and the reason we landed where we did.
> **Last reviewed:** June 2026.

---

## 0. The 30-second picture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         EXPO MOBILE APP                                │
│                                                                        │
│   Zustand stores ──persist──> MMKV  (lib/storage.ts)                   │
│        │                       (offline-first source of truth)         │
│        │                                                               │
│        ├─ assembleCoachContext() ─> buildDynamicContext()  ┐           │
│        │                                                    │           │
│        ▼                                                    ▼           │
│   ┌─────────────┐                              ┌──────────────────────┐ │
│   │ Supabase    │  session.access_token        │  Coach client        │ │
│   │ Auth client │ ───────────────────────────> │  lib/coach/client.ts │ │
│   └─────────────┘                              └──────────┬───────────┘ │
└───────────────────────────────────────────────────────────┼───────────┘
                                                             │
                 has session?  ──── YES ──────────┐          │ NO (dev / pre-auth)
                                                  ▼          ▼
                       ┌─────────────────────────────┐  ┌──────────────────────────┐
                       │   RAILWAY BACKEND (Fastify)  │  │  Direct Gemini call from │
                       │   POST /api/coach            │  │  device (EXPO_PUBLIC key) │
                       │   • verifies Supabase JWT    │  └────────────┬─────────────┘
                       │   • rate-limits per user     │               │
                       │   • holds Gemini key         │               │
                       └──────────────┬───────────────┘               │
                                      │                               │
                                      ▼                               ▼
                          ┌───────────────────────────────────────────────┐
                          │  Google Gemini  (generativelanguage API)       │
                          │  responseSchema = COACH_RESPONSE_SCHEMA (JSON)  │
                          └───────────────────────────────────────────────┘
                                      │
                                      ▼
                          parseModelJSON() → parseCoachResponse() → typed CoachResponse
```

Three persistence tiers, one AI provider, one shared JSON contract. The rest of this doc unpacks each box.

---

## 1. Where data lives (storage tiers)

We run **three** storage layers, each with a deliberate job. They are not redundant — each one exists because the others can't do its job.

| Tier | Tech | Holds | Why it exists |
|------|------|-------|---------------|
| **Device cache** | **MMKV** (`react-native-mmkv` v4) | All app state: profile, meal logs, workouts, PRs, hydration, sleep, theme, onboarding flags | Instant, synchronous, offline-first. The app must fully work with **zero network**. |
| **Auth session** | **Supabase Auth**, persisted *into* MMKV | JWT access/refresh tokens, user identity | Owns who the user is + the token we attach to every backend call. |
| **Cloud DB** | **Supabase Postgres** (via Railway backend) | `profiles`, `meal_logs` (server mirror) | Cross-device sync + a server-trusted copy the Gemini key holder can read. |

### 1.1 MMKV — the real source of truth

`lib/storage.ts` creates **one** MMKV instance and exposes three adapters:

```ts
export const storage = createMMKV({ id: 'tapped-in-storage' });

// 1. zustandMMKVStorage  — JSON string get/set/remove, used by Zustand `persist`
// 2. storageAsyncCompat  — AsyncStorage-shaped (async) wrapper for legacy workout code
// 3. STORAGE_KEYS        — frozen key registry (never rename — users lose data)
```

Every Zustand store persists through `zustandMMKVStorage`. So the data model on disk is literally **"one MMKV key per store, value = JSON blob."**

```
MMKV (id: tapped-in-storage)
├── tapped_in_profile              → UserProfile (camelCase, UI format)
├── tapped_in_tracker_logs         → Record<dateKey, DailyLog{ meals[], totals, micros, waterMl }>
├── tapped_in_workout_plans        → WorkoutPlan[]
├── tapped_in_workout_logs         → WorkoutLog[]
├── tapped_in_exercise_prs         → Record<exerciseName, ExercisePR>
├── tapped_in_active_workout       → in-progress session
├── tapped_in_sleep_logs           → SleepLog[]
├── tapped_in_hydration_settings   → glass size, target, electrolytes
├── tapped_in_theme                → 'light' | 'dark'
└── sb-<project>-auth-token        → Supabase session (written by Supabase Auth)
```

> **Note on STORAGE_KEYS:** the comments in `lib/storage.ts` literally say *"never rename (users lose data)."* These keys are an append-only contract. A rename = a silent data-wipe for everyone who already has the old key on disk.

**Why MMKV, not the alternatives:**

| Option | Why we rejected it |
|--------|--------------------|
| `AsyncStorage` | Async + slow (bridges to native on every read). UI would flash empty state on every cold start while it loads. |
| `expo-secure-store` | Tiny size limits, encrypted-only, made for secrets not bulk logs. |
| **SQLite/Drizzle as primary store** | Overkill for "load a JSON blob per feature." We *plan* SQLite (see CLAUDE.md / TRACKER_SYSTEM_PLAN) for relational meal/ingredient queries, but the **state layer** wants a synchronous KV, not joins. |
| **MMKV ✅** | Synchronous (no async flash), C++ fast, JSI-backed, pairs cleanly with Zustand `persist`. Offline-first by default. |

> Reality check: CLAUDE.md lists "Expo SQLite + Drizzle ORM" as the DB layer, but there is **no `lib/db/` in the repo yet** — it's planned, not built. Today, **MMKV is the only on-device persistence.** This doc describes what's actually wired.

---

## 2. What Supabase is for (and what it is NOT)

Supabase plays **two separate roles**. Keep them mentally separate.

```
                ┌────────────────────────── SUPABASE ──────────────────────────┐
                │                                                               │
   MOBILE  ─────┤  ROLE 1: AUTH                ROLE 2: POSTGRES DB              │
                │  ┌──────────────────┐        ┌──────────────────────────┐    │
                │  │ anon key (public)│        │ profiles                 │    │
                │  │ login/refresh    │        │ meal_logs                │    │
                │  │ issues JWT       │        │ (RLS — row level security)│    │
                │  └──────────────────┘        └──────────────────────────┘    │
                │          ▲                              ▲                     │
                └──────────┼──────────────────────────────┼─────────────────────┘
                           │ JWT in MMKV                   │ service_role key
                           │                               │ (server-only!)
                    ┌──────┴───────┐               ┌───────┴────────┐
                    │ Mobile app   │               │ Railway backend │
                    │ lib/supabase │               │ middleware/auth │
                    └──────────────┘               └─────────────────┘
```

### 2.1 Role 1 — Auth (mobile side)

`lib/supabase.ts` creates the client with the **public anon key** and stores the session **inside MMKV**:

```ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: { /* delegates to zustandMMKVStorage */ },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,   // mobile — no URL callback parsing
  },
});
```

The session token is what we hand to the backend on every authenticated call.

### 2.2 Role 2 — Postgres DB (backend side)

The backend (`backend/src/lib/supabase.ts`) uses the **service-role key**, which bypasses RLS and has full DB access. **This key never touches the mobile bundle** — leaking it would let anyone read every user's rows.

Two tables today:
- `profiles` — upserted by `PUT /api/profile` (Zod-validated server-side).
- `meal_logs` — mirror of the device meal log, upserted by `POST /api/logs`.

**Why Supabase, not the alternatives:**

| Option | Why we rejected / dropped it |
|--------|------------------------------|
| **Clerk** (was in the original plan) | **Dropped June 2026.** Clerk = auth only; we'd still need a separate DB + a way to bridge Clerk identity into Postgres RLS. One vendor for auth+DB+RLS is simpler. CLAUDE.md rule #6: *"Supabase Auth is our sole auth provider. Do not add Clerk shims."* |
| **Firebase / Firestore** | NoSQL; we want relational + RLS + plain SQL. Also ties us harder to Google than we want for *data* (we already lean on Google for the LLM). |
| **Roll-our-own JWT** | Token rotation, refresh, secure storage, RLS — all solved problems we'd be re-implementing badly. |
| **Supabase ✅** | Auth + Postgres + Row-Level-Security from one vendor. JWT verifies server-side with `supabase.auth.getUser(token)`. RLS means even a leaked anon key can't read another user's rows. |

> ✅ **Fully Supabase-native (June 2026 cleanup):** `middleware/auth.ts` sets `req.userId` from `supabase.auth.getUser(token)`, and `routes/logs.ts` + `routes/profile.ts` query a `user_id` (UUID) column that references `auth.users(id)`. RLS policies use `auth.uid()`. No Clerk fields, columns, or env keys remain anywhere in the codebase.

---

## 3. How we call the LLM

**Provider: Google Gemini** (`generativelanguage.googleapis.com`). We use the LLM for **three distinct jobs**, each with its own model + config:

| Job | Entry point | Model | Mode |
|-----|-------------|-------|------|
| **Meal photo scan** | `lib/gemini-scan.ts` (device) · `backend/lib/gemini.ts` (server) | `gemini-2.5-flash` | Vision + JSON |
| **Workout generation** | `backend/lib/gemini.ts` → `generateWorkoutSkeleton` | `gemini-2.5-flash` | JSON, 8192 tok |
| **Coach chat** | `lib/coach/client.ts` (device) · `backend/routes/coach.ts` (server) | `gemini-2.5-flash-lite` → `2.5-flash` (retry) | **responseSchema** JSON |

### 3.1 The dual-path coach call (the important one)

The coach has a **backend-first, device-fallback** design:

```
sendToCoach(userMessage, history, staticInstruction, dynamicContext)
│
├─ supabase.auth.getSession()
│     │
│     ├─ session exists ──> apiClient.postCoach(token, …)
│     │                       └─> POST /api/coach  (Railway)
│     │                            ├─ requireAuth  (verify JWT)
│     │                            ├─ checkRateLimit (100/hr/user)
│     │                            ├─ Zod-validate body
│     │                            └─ callCoachGemini()  ← Gemini key server-side
│     │
│     └─ no session / backend down ──> callGemini() directly from device
│                                        (EXPO_PUBLIC_GEMINI_API_KEY)
│
└─ both paths end at: parseCoachResponse(parseModelJSON(raw))
```

**Why two paths:**
- **Backend path** keeps the Gemini key server-side (a key in the mobile bundle can be extracted), enables per-user rate limiting, and lets us do explicit prompt caching later.
- **Device path** exists so the feature works *today*, before the auth UI ships, and during local dev. It's a deliberate temporary fallback, not the end state.

### 3.2 Prompt structure — static vs dynamic (caching trick)

We split the prompt in two so Gemini can cache the expensive, unchanging half:

```
┌──────────────────────────────────────────────────────────┐
│ systemInstruction  =  COACH_STATIC_INSTRUCTION            │  ← same every call
│   • tone + format rules                                   │     Gemini implicitly
│   • evidence shortlist (vetted DOIs)                      │     caches this prefix
│   • hard rules (1.8 g/kg protein, oil, no auto-log…)      │
│   • action catalogue                                      │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ contents[0] (user)  =  buildDynamicContext(ctx)           │  ← changes per user/day
│   "USER DATA: PROFILE… TARGETS… MEALS TODAY… PRs…"        │     sent as a primed turn
│ contents[1] (model) =  {"ready":true}                     │     (fake ack so the model
│ …history (last 16)…                                       │      treats it as context)
│ contents[last] (user) = userMessage                       │
└──────────────────────────────────────────────────────────┘
```

`buildDynamicContext()` (in `lib/coach/prompt.ts`) flattens live store data into a compact text block — profile, targets, today's meals, 7-day consistency, micros, oil-check status, workout volume, PRs, plans. This is assembled by `assembleCoachContext()` from a pure function reading the Zustand stores.

**Why split static/dynamic, not one big prompt:** the static half is ~2-3k tokens of rules that never change. Putting it in `systemInstruction` lets Gemini cache it, so we only pay full price for the small dynamic block each turn. One monolithic prompt would re-bill the rules every message.

### 3.3 Generation config

```ts
generationConfig = {
  temperature: 0.3,                       // low — consistency over creativity
  maxOutputTokens: 1024,
  responseMimeType: 'application/json',   // force JSON, no prose
  responseSchema: COACH_RESPONSE_SCHEMA,  // structured-output contract
  thinkingConfig: { thinkingBudget: 0 },  // disable thinking on 2.5 — latency
}
```

**Why these settings:**
- **`temperature: 0.3`** — a coach citing studies shouldn't improvise. Low temp = stable, repeatable answers.
- **`thinkingBudget: 0`** — Gemini 2.5's "thinking" adds seconds of latency we don't want in a chat. The schema does the structuring work instead.
- **Model ladder `flash-lite → flash`** — start cheap/fast; only escalate to the bigger model on a 5xx/429/`MAX_TOKENS` retry.

---

## 4. The JSON schema (the contract that ties it all together)

This is the single most important design decision in the AI layer. Yes — **we use a JSON schema**, and it's *shared* between mobile and backend.

```
shared/schemas/coach.ts  ──exports──>  COACH_RESPONSE_SCHEMA
        │
        ├── imported by  lib/coach/schema.ts      (mobile)
        └── imported by  backend/lib/gemini.ts    (backend)
```

One file, two consumers, so the model is constrained **identically** no matter which path runs.

### 4.1 Two layers of safety

We never trust raw model output. There are **two** gates:

```
Gemini output (JSON string)
      │
      ▼
[Gate 1] parseModelJSON()            lib/json-repair.ts
      │   • strip ```json fences
      │   • slice to outermost { }
      │   • repairTruncatedJSON() — close dangling braces if cut at token ceiling
      ▼
[Gate 2] parseCoachResponse()        lib/coach/validate.ts
      │   • hand-written type guards (isStr/isNum/isObj…)
      │   • drop malformed actions, KEEP the message
      │   • whitelist routes (ALLOWED_ROUTES)
      │   • clamp actions to max 2, suggestions to max 2
      ▼
typed CoachResponse  →  rendered in UI
```

**Why two gates, not just the schema:**
- `responseSchema` is a *strong hint*, not a guarantee — Gemini can still truncate at the token ceiling or wrap output in markdown fences. Gate 1 repairs the *syntax*.
- Even syntactically valid JSON can be *semantically* wrong (a `navigate` action to a route that doesn't exist, a meal with zero items). Gate 2 enforces *meaning* and, crucially, **fails soft**: a bad action is dropped but the user still sees the text answer. We never blank the screen on a parse hiccup.

### 4.2 Shape of `COACH_RESPONSE_SCHEMA`

```
COACH_RESPONSE_SCHEMA  (Gemini OBJECT type)
├── message            STRING   (required)
├── isOffTopic         BOOLEAN  (required)
├── followUpSuggestions ARRAY<STRING>
├── citations          ARRAY<{ claim, authors, year, journal, doi }>
├── verdict            { rating, claim }           ← fact-check mode
├── userTranscript     STRING                      ← voice mode (dormant)
└── actions            ARRAY<{ kind, label, … }>   ← the agentic layer, max 2
        │
        └── 15 action kinds, all in one polymorphic object:
            navigate · log_meal · log_meals_batch · generate_workout ·
            start_workout · edit_workout · edit_notes · edit_profile ·
            quick_log · manage_plan · log_weight · log_workout ·
            log_cardio · edit_meal · manage_log
```

> Gemini's schema dialect uses uppercase types (`OBJECT`, `STRING`, `INTEGER`, `NUMBER`, `BOOLEAN`, `ARRAY`) — **not** standard JSON-Schema lowercase. That's why the file looks unusual. It's the Google `responseSchema` format, not Draft-07.

### 4.3 The action protocol — "propose, never execute"

The `actions` array is how the LLM *drives the app* without ever being trusted to mutate data. CLAUDE.md rule #5: **AI scan never auto-logs. User confirms every ingredient.** Same principle for the coach:

```
Model emits action  →  app validates (validate.ts)  →  renders a confirm card  →  USER taps  →  store mutates
                                                                                    ▲
                                                          nothing changes until the human confirms
```

Each action kind has its own validator in `ACTION_VALIDATORS` (validate.ts). Unknown kinds → dropped. This is the "agentic action layer" referenced in the coach-revamp notes.

**Why a single polymorphic `actions[]` with a `kind` discriminator, not separate response types:**

| Option | Why we rejected it |
|--------|--------------------|
| Separate Gemini call per intent ("is this a log? a navigate?") | 2-3x the latency and cost; the model already knows intent from context. |
| Free-form function-calling / tool API | Gemini tool-calling is heavier and harder to validate offline; our discriminated union + hand-written guards give us total control and a soft-fail path. |
| One response shape per action (no union) | The model often wants to answer **and** offer an action in the same turn. A `message` + `actions[]` envelope handles "here's the answer, want me to log it?" in one round-trip. |
| **Discriminated union ✅** | One round-trip returns prose + citations + up to 2 proposed actions. App validates each independently. Clean, cheap, safe. |

---

## 5. The meal-scan schema (second, simpler contract)

Separate, smaller JSON contract for the camera path (`lib/gemini-scan.ts`):

```json
{
  "dishName": "string",
  "confidence": "high | medium | low",
  "ingredients": [
    { "name", "nameHindi", "estimatedWeightGrams", "weightState",
      "caloriesPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g" }
  ],
  "oilWarning": true,
  "notes": "string"
}
```

The hard rule baked into the prompt: **oil/ghee/butter must NEVER appear in `ingredients[]`** — only surfaced via `oilWarning` + `notes`. This enforces CLAUDE.md rule #4 (mandatory oil check) at the *prompt* level, then the user confirms weights before anything is logged.

**Why prompt-enforced JSON here instead of `responseSchema`:** the device scan path is a plain `fetch` with `temperature: 0.1` and an inline example in the prompt — lighter than wiring the full schema object, and the shape is small enough that fence-stripping + `JSON.parse` is reliable. The server path (`backend/lib/gemini.ts`) uses the SDK with a regex `{…}` extract for the same reason.

---

## 6. End-to-end: one coach message

Putting every piece together — what happens when the user types *"I had 2 rotis and dal, log it"*:

```
1. UI reads live Zustand stores
        │
2. assembleCoachContext(stores)         lib/coach/prompt.ts
        │   → CoachContext (profile, targets, today's meals, PRs, volume…)
3. buildDynamicContext(ctx)             → compact "USER DATA: …" text block
        │
4. sendToCoach(msg, history, STATIC_INSTRUCTION, dynamicContext)
        │
5. session? ── yes ──> POST /api/coach (Railway)
        │              ├─ requireAuth (verify Supabase JWT)
        │              ├─ rate limit
        │              ├─ Zod validate
        │              └─ callCoachGemini → Gemini (responseSchema)
        │
6. Gemini returns JSON:
        {
          "message": "logged below. 2 rotis + dal ≈ 360 kcal, 14g protein.",
          "actions": [{ "kind": "log_meal", "label": "log meal",
                        "meal": { "mealName": "roti + dal", "items": [...],
                                  "oilHint": { "likely": true, "estimatedGrams": 12 } } }],
          "citations": [], "isOffTopic": false
        }
        │
7. parseModelJSON()  → parseCoachResponse()   (two gates)
        │   → CoachAction validated, route/shape checked, oilHint preserved
        │
8. UI renders message + a "log meal" confirm card
        │
9. USER taps "log meal"  →  tracker-store mutates  →  MMKV persists
        │
10. (later) POST /api/logs syncs the meal_logs row to Supabase Postgres
```

Notice: **the model proposed, the store didn't change until step 9**, and Supabase only saw it at step 10. That separation — propose → confirm → local write → cloud sync — is the spine of the whole architecture.

---

## 7. Cheat-sheet: every "why this not that" in one table

| Decision | We chose | Over | Because |
|----------|----------|------|---------|
| On-device store | **MMKV** | AsyncStorage, SecureStore, SQLite | Synchronous, fast, offline-first, no empty-state flash |
| Auth + cloud DB | **Supabase** | Clerk, Firebase, custom JWT | One vendor for auth + Postgres + RLS; Clerk dropped June 2026 |
| LLM provider | **Gemini 2.5 Flash** | — | Native vision + JSON `responseSchema` + cheap `flash-lite` tier |
| Structured output | **Gemini `responseSchema`** + 2 validation gates | trust raw text, function-calling | Schema = strong hint; guards = guarantee + soft-fail |
| Action design | **polymorphic `actions[]` union** | per-intent calls, tool API | One round-trip = prose + citations + ≤2 proposed actions |
| Mutation safety | **propose → user confirms** | auto-execute | CLAUDE.md rules #4/#5: nothing logs without a human tap |
| Prompt layout | **static `systemInstruction` + dynamic turn** | one monolithic prompt | Cache the unchanging rules; only re-bill the small live block |
| Coach transport | **backend-first, device-fallback** | device-only | Keep Gemini key server-side + rate-limit, but still ship before auth UI |

---

## 8. Open gaps (so the doc stays honest)

- **SQLite/Drizzle is planned, not built.** No `lib/db/` exists yet; MMKV is the only persistence today.
- **Voice-to-coach** (`sendVoiceToCoach`, `userTranscript`) is wired but dormant — revival is UI-only.
- **Explicit Gemini caching** is set up structurally (static/dynamic split) but currently relies on *implicit* `systemInstruction` caching; explicit cache handles aren't created yet.

---

*Source files referenced: `lib/storage.ts`, `lib/supabase.ts`, `lib/gemini-scan.ts`, `lib/api-client.ts`, `lib/json-repair.ts`, `lib/coach/{client,prompt,validate,actions,schema}.ts`, `shared/schemas/coach.ts`, `shared/prompts/coach.ts`, `backend/src/{index,lib/gemini,lib/supabase,middleware/auth,routes/coach,routes/logs,routes/profile}.ts`.*
