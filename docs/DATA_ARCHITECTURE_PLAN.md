# Data Architecture Plan — WatermelonDB + Catalog SQLite + MMKV + Supabase

> The decided local-first data architecture for Tapped In.
> **Status:** Approved June 2026. Supersedes the vague "SQLite/Drizzle for user data" line in CLAUDE.md.
> **Decision owner:** solo dev — optimized for $0 cost to scale, no compromise on performance.

---

## 1. The decision (and why)

We evaluated three local-first sync strategies for a data-heavy fitness app (meals, workouts, sleep, hydration, weight, cardio, streaks, coach chat — all append-heavy, all growing daily).

| Option | Verdict |
|---|---|
| Hand-rolled SQLite + Drizzle + custom sync | Rejected — we'd own the sync bug surface forever; every feature touches plumbing. |
| **PowerSync** (managed sync service) | Rejected — free tier caps at **50 peak concurrent connections** / 2 GB/mo; a peaky consumer fitness app crosses that in the low-hundreds of DAU, then it's **$49/mo+** scaling with users. |
| **WatermelonDB** ✅ | **Chosen** — MIT library, **free at any user count**, RN-purpose-built performance (JSI, lazy-loading, observable), scales to tens of thousands of records. Cost is engineering time (we write the sync endpoints), which a solo dev can absorb; cost is **never money**. |

**Why WatermelonDB wins for us specifically:** our hard constraint is "$0 until well past 1,000 active users." WatermelonDB is a client library with no metered service, so 10 users and 100,000 users both cost $0 in sync — we only pay the Railway + Supabase we already run. We trade extra sync-endpoint code (one-time) for permanent $0 sync.

**Compatibility confirmed:** WatermelonDB runs on Expo SDK 54 + New Architecture (mandatory in 54) + React 19 via `@morrowdigital/watermelondb-expo-plugin`. Uses JSI for synchronous DB ops. (iOS-only `simdjson` Podfile conflict from the plugin — delete the line it adds; irrelevant on Android-first.)

---

## 2. The three-tier storage model

The critical insight: **catalog data and user data are different problems.** Don't put them in the same store.

```
┌──────────────────────────────── DEVICE ────────────────────────────────┐
│                                                                          │
│  ① MMKV (lib/storage.ts)          ── ephemeral, synchronous KV          │
│      theme · onboarding flags · paywall flag · hydration SETTINGS ·      │
│      Supabase session token · "watermelon_migration_done" flag          │
│                                                                          │
│  ② catalog.db (expo-sqlite, read-only)  ── BUNDLED asset, FTS5          │
│      foods (FTS5)  ·  barcode_products (indexed)  ·  exercises           │
│      → shipped prebuilt, copied on first launch, version-bumped         │
│      → NOT synced (reference data, identical for all users)             │
│                                                                          │
│  ③ WatermelonDB                          ── USER data, reactive, synced  │
│      meals · workouts · sleep · hydration_days · weight · cardio ·       │
│      streaks · coach_messages · custom_foods · saved_meals              │
│        │  Watermelon auto-tracks _status / _changed (no manual dirty)    │
│        ▼                                                                  │
│   synchronize({ pullChanges, pushChanges })                             │
└────────────────┼─────────────────────────────────────────────────────────┘
                 │  on login + app-foreground + pull-to-refresh
                 ▼
   ┌──────────────────────────┐        ┌────────────────────────────────┐
   │ Railway backend (Fastify) │ <────> │  Supabase Postgres (RLS)        │
   │  POST /api/sync/pull      │        │  soft-delete tombstones         │
   │  POST /api/sync/push      │        │  user_id = auth.uid()           │
   │  (also: Gemini AI routes) │        └────────────────────────────────┘
   └──────────────────────────┘
```

**Tier responsibilities:**
- **MMKV** — keep exactly what it's great at: tiny synchronous settings/flags/session. Untouched by this migration except adding one migration-done flag.
- **catalog.db** — the big food DB + barcode lookups. Read-only, bundled, FTS5. No sync, no conflicts ever. (Drizzle is fine *here* if we want it — it's not synced, so no Watermelon coupling.)
- **WatermelonDB** — every per-user read/write record. Reactive (UI auto-updates), synced to Supabase via endpoints we own.

---

## 3. WatermelonDB schema (user data)

Modeling rule: **a row per record you query by; nested arrays you always load whole → `@json` columns** (don't over-normalize). Every table carries `server_id` (the client-UUID that's also the Postgres PK) so local and cloud rows map 1:1. Watermelon adds `id`, `_status`, `_changed` automatically.

```
foods/ingredients inside a meal are loaded whole → JSON, not child tables.
```

| Table | Key columns | JSON columns | Notes |
|---|---|---|---|
| `meals` | `date_key` (idx), `meal_type`, `name`, `is_cooked`, `log_method`, `logged_at`, `total_calories`, `total_protein_g`, `total_carbs_g`, `total_fat_g` | `ingredients` (LoggedIngredient[]), `oil_entry` (OilEntry?), `micros` (MicroMap) | maps `LoggedMeal` (data/tracker-types.ts) |
| `workouts` | `date` (idx), `session_name`, `total_sets`, `duration_minutes`, `feeling_rating`, `energy_level`, `sleep_last_night`, `notes` | `exercises` (with sets[]/rpe), `prs_achieved` (string[]) | maps `WorkoutLog` |
| `exercise_prs` | `exercise_name` (idx, unique), `max_weight`, `max_reps`, `estimated_1rm`, `achieved_at` | — | maps `ExercisePR` |
| `workout_plans` | `is_active`, `split_name`, `source`, `created_at` | full plan blob (sessions, cardioProgram, citations…) | maps `WorkoutPlan`; rarely queried into → mostly JSON |
| `sleep_entries` | `date_key` (idx), `bedtime`, `wake_time`, `duration_min`, `quality`, `wake_count`, `source` | `notes` | maps `SleepEntry` |
| `hydration_days` | `date_key` (idx, unique), `water_ml`, `weight_kg?` | `electrolytes` (ElectrolyteLog) | per-day metrics row (split out of old DailyLog) |
| `cardio_logs` | `date` (idx), `modality`, `minutes`, `avg_hr?` | — | from coach `log_cardio` action |
| `streaks` | `kind`, `current`, `best`, `last_date` | `ring_state` | completeness rings / Tapped In score |
| `coach_messages` | `role`, `timestamp` (idx), `conversation_id?` | `parsed` (CoachResponse), `text` | chat history — grows fast, indexed by time |
| `custom_foods` | `name`, `created_at`, per-100g macros | `micros_per_100g` | user-created; **synced** so it follows the user across devices |
| `saved_meals` | `name`, `created_at`, totals | `ingredients` (SavedMealIngredient[]) | meal templates; **synced** |

> Daily totals that were cached in the old `DailyLog` blob are recomputed on the fly from `meals` (cheap with a date index) or cached in `hydration_days`. We stop storing one giant `Record<dateKey, DailyLog>` — that blob was the scaling cliff.

---

## 4. The sync protocol (the part we own)

WatermelonDB's `synchronize()` does the hard client-side bookkeeping for us — it tracks which rows changed (`_status`/`_changed`) so **we never hand-roll dirty flags**. We only implement two backend endpoints that translate its protocol to Supabase.

```
synchronize({
  pullChanges: async ({ lastPulledAt }) => {
    // POST /api/sync/pull { lastPulledAt }
    // → { changes: { meals: {created,updated,deleted}, ... }, timestamp }
  },
  pushChanges: async ({ changes, lastPulledAt }) => {
    // POST /api/sync/push { changes, lastPulledAt }
    // → apply to Supabase, 200 OK
  },
})
```

### `POST /api/sync/pull`  (Railway → Supabase, server→client)
For each synced table, query Supabase for rows where `updated_at > lastPulledAt AND user_id = auth.uid()`, split into:
- `created` / `updated` — live rows (Watermelon treats both as upserts).
- `deleted` — ids where `deleted_at > lastPulledAt` (**soft-delete tombstones**, see below).
Return `{ changes, timestamp: serverNow }`.

### `POST /api/sync/push`  (client→Supabase)
Apply the client's `created`/`updated` as **upserts** and `deleted` as **soft-deletes** (`deleted_at = now()`), all scoped to `auth.uid()`. **Last-write-wins** by comparing `updated_at` — simple and correct for a single-user-multi-device app (you rarely edit the same meal on two phones at once).

### Tombstones (don't skip this)
Hard deletes break multi-device sync (a row deleted on phone A silently re-uploads from phone B). Every synced Postgres table gets a `deleted_at TIMESTAMPTZ` column; "delete" = set `deleted_at`; pull returns recently-tombstoned ids so other devices remove them. ⚠️ The current `DELETE /api/logs/:id` is a hard delete — it gets replaced by this soft-delete model.

### When sync runs
On successful login, on app foreground, and on manual pull-to-refresh. Not continuous/realtime — perfectly fine for fitness data. Fully offline between syncs; all writes hit local Watermelon instantly.

---

## 5. The catalog (foods + barcode) — separate, bundled, FTS5

This is independent of sync and delivers the food-DB win on its own.

1. **Seed-build script** (Node, runs in CI): ingest food sources → emit `catalog.db` with an **FTS5** virtual table on food name (+ `name_hindi`), and a `barcode_products` table with a UNIQUE index on `barcode`.
2. **Ship it** as an app asset; copy from bundle → `documentDirectory` on first launch (`expo-asset` + `expo-file-system`), guarded by a version flag so we can update the catalog on app updates.
3. **Rewrite `searchFoods()`** (lib/food-utils.ts) to `SELECT … FROM foods_fts WHERE foods_fts MATCH ? LIMIT 20` instead of filtering a JS array. Keep the diet-filter logic on top of the result set.
4. **Barcode lookup — DECIDED: online Open Food Facts + on-device cache (no shipped subset).**
   - `SELECT * FROM barcode_products WHERE barcode = ?`; on a miss, call OFF, then insert the hit so repeat scans are offline.
   - **Source:** `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json` (no auth for reads).
   - **Required User-Agent:** `TappedIn/1.0 (contact-email)` — OFF blocks anonymous/bot traffic.
   - **License:** ODbL — show "Product data from Open Food Facts" attribution in-app. Caching per-device avoids the share-alike trap that bundling an OFF subset (merged with our foods) would trigger.
   - **Map defensively** from `nutriments` (`energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`); handle missing fields; OFF is crowdsourced.
   - **Miss / offline → manual entry → "save as custom food"** (reuses existing infra, now synced via Watermelon). Like AI scan, barcode pre-fills but **user confirms before logging** (rule #5).
   - **Scanner UI:** add `expo-camera` (`CameraView` does barcode scanning natively).

> **Why online+cache, not a shipped subset:** a scanner's value is broad coverage (OFF ~3–4M products); a curated offline subset misses most real scans. Online keeps app size tiny and dodges ODbL share-alike. The `barcode_products` table is built as a normal cache the online path writes into — so **pre-seeding it with a bundled subset later is a tiny definition, not a rearchitecture**, if usage data ever justifies it.

---

## 6. Migration off the current MMKV blobs

One-time, runs on the update that ships this, guarded by an MMKV flag `watermelon_migration_done`:

1. Read existing MMKV blobs: `tapped_in_tracker_logs`, `tapped_in_workout_logs`, `tapped_in_exercise_prs`, `tapped_in_sleep_logs`, `tapped_in_workout_plans`, `tapped_in_custom_foods`, `tapped_in_saved_meals`.
2. Transform each into Watermelon rows (split the `DailyLog` Record into `meals` + `hydration_days`).
3. Batch-insert inside one Watermelon write transaction.
4. Set `watermelon_migration_done = true`; never run again.
5. Leave the old MMKV keys in place for one release (rollback safety), then remove the read paths.

Pre-launch with few testers = low stakes, but write it properly so existing testers don't lose data.

---

## 7. What stays in MMKV (do NOT migrate)

`theme`, `onboarding_complete`, `paywall_shown`, `hydration_settings` (device-local prefs, not logs), `recent_food_ids`, the Supabase session token, and the new migration flag. These are small, synchronous, device-local — exactly MMKV's job. Zustand stays for ephemeral UI state; Watermelon owns persisted records.

---

## 8. Build sequence

| Phase | Work | Independent? |
|---|---|---|
| **0** | Install: `@nozbe/watermelondb`, `@nozbe/with-observables`, `@morrowdigital/watermelondb-expo-plugin`; config plugin in app.json; `prebuild`; smoke-test a model on a dev build | — |
| **1** | **Catalog.db**: seed-build script, FTS5 schema, asset-copy, rewrite `searchFoods` + barcode lookup | ✅ ship-able alone |
| **2** | Watermelon schema + models for all user tables; store adapters; **migration off MMKV blobs**; switch UI reads to observables | depends on 0 |
| **3** | `deleted_at` columns + RLS on Supabase; `POST /api/sync/pull` + `/push` on Railway; wire `synchronize()` (login/foreground); replace hard-delete route | depends on 2 |
| **4** | Remove legacy MMKV blob read paths; update CLAUDE.md architecture section | depends on 2,3 |

Phase 1 is fully decoupled — it can ship in the next update on its own (pure win, no sync risk). Phases 2–3 are the local-first user-data migration.

---

## 9. Honest costs we accepted

- **We lose Drizzle for user data** — WatermelonDB is its own ORM (decorators, `Model` classes, `Q` queries). Drizzle remains usable only for the read-only catalog.
- **We write & maintain the sync endpoints** (pull/push) and own conflict (LWW) + tombstone logic. Well-trodden, but it's our code.
- **Reactivity refactor** — persisted-data components move from Zustand selectors to Watermelon observables (`withObservables`).
- **Two SQLite stores** on device (catalog read-only + Watermelon) — clean separation, slight conceptual overhead.
- **$0 forever on sync.** That was the point.

---

*Grounded in: data/tracker-types.ts, data/sleep-types.ts, data/hydration-types.ts, stores/workout-store.ts, lib/food-utils.ts, lib/storage.ts, backend/src/routes/{logs,profile}.ts, docs/supabase-schema.sql.*
