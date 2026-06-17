# Home Screen Overhaul + Micronutrient/Science/Supplement Systems

> Implementation plan approved June 2026. Covers the home-screen redesign, a config-driven
> micronutrient model, a supplement tracking feature, an expanded science library, a typography
> pass, and a calmer workout-generator loader. Pick up from "Build order" below.

## Context

The home screen (`app/(tabs)/results.tsx` — the tab titled **"home"**) looks good but isn't doing its job: it isn't insight-dense or scrollable enough, the information hierarchy buries nutrients, the "your targets" block adds little here, the science pick draws from a small 30-card pool, and the typography hierarchy is weaker than the rest of the app. Separately, the micronutrient system only covers 5 nutrients (hardcoded across ~6 files), so users can't see whether they're hitting the full spectrum, and there's no supplement awareness. The workout generator's loading animation (an animated stickman lifting a barbell) reads as gimmicky.

Goal: turn the home screen into a single, highly scrollable "everything you need for the day" surface — **nutrients first**, micronutrient panel right under it, then auto-generated insight, streak, trends, supplement tracking, meals, workout, and a daily rotating science pick — backed by a config-driven micronutrient model (~23 nutrients), a supplement tracking feature, an expanded verified science library, and a calmer workout loader.

External research (MacroFactor, Cronometer, MyFitnessPal, Lose It, etc. — reviews + UX writeups) reinforced the direction: lead with the day's headline numbers, surface *one actionable insight* per visit, show consistency/streaks (strongly tied to retention), expose micronutrient gaps with concrete food/supplement fixes, keep logging frictionless, and avoid cognitive overload by grouping rather than dumping metrics.

**Decisions locked with the user:**
- Micronutrients: **comprehensive (~23 total)** roster.
- Supplements: **recommend + track daily** (intake counts toward micro totals).
- Science library: **curated batch (~80–100 verified meta-analyses) + a documented template** to grow toward 200.
- Home modules to add: **consistency/streak, 7-day trends, daily insight card, supplement reminder** (all four).

---

## Workstream 1 — Config-driven micronutrient model (~23 nutrients)

**Why:** Micros are currently 5 hardcoded numeric fields duplicated across `LoggedIngredient`, `LoggedMeal`, `DailyLog`, `CustomFoodItem`, `SavedMealIngredient`, `ZERO_MICROS` (`data/tracker-types.ts`), every food in `data/foods.ts`, `recomputeTotals` in `stores/tracker-store.ts`, and `ROWS` in `components/MicroPanel.tsx`. Adding 18 more the same way is unmaintainable. Refactor to a single registry + a `Record<string, number>` intake map.

**New file — `data/micronutrients.ts`** (single source of truth):
```ts
export interface MicroDef {
  key: string;            // e.g. 'magnesium'
  label: string;          // 'magnesium'
  unit: string;           // 'mg' | 'mcg' | 'IU' | 'g'
  rda: number;            // adult daily target
  kind: 'reach' | 'ceiling';   // sodium = ceiling ("stay under")
  group: 'mineral' | 'vitamin' | 'fatty_acid';
  colorKey: string;       // token from constants/colors.ts
  warning: string;        // education text (gap explanation)
  precision: number;
  commonlyLow?: boolean;  // drives supplement nudges & "core gaps" filter
}
export const MICRONUTRIENTS: MicroDef[] = [ /* 23 entries */ ];
export const MICRO_KEYS = MICRONUTRIENTS.map(m => m.key);
```

**Roster (unit · adult RDA · group):** iron mg·8·M | calcium mg·1000·M | magnesium mg·400·M | potassium mg·3500·M | sodium mg·2300·M *(ceiling)* | zinc mg·11·M | selenium mcg·55·M | iodine mcg·150·M | phosphorus mg·700·M | copper mg·0.9·M | manganese mg·2.3·M | vitamin A mcg·900·V | vitamin C mg·90·V | vitamin D IU·600·V | vitamin E mg·15·V | vitamin K mcg·120·V | thiamin (B1) mg·1.2·V | riboflavin (B2) mg·1.3·V | niacin (B3) mg·16·V | vitamin B6 mg·1.7·V | folate (B9) mcg·400·V | vitamin B12 mcg·2.4·V | omega-3 g·1.6·F. *(Iron/some vitamins differ by sex — ship one adult RDA now; leave a `rdaBySex?` hook noted for later.)*

**Data shape migration:**
- `data/tracker-types.ts`: replace the 5 explicit micro fields on `LoggedIngredient`/`LoggedMeal`/`DailyLog` with `micros: Record<string, number>`; replace per-100g micro fields on `CustomFoodItem`/`SavedMealIngredient` with `microsPer100g: Record<string, number>`; `ZERO_MICROS` becomes a zeroed map built from `MICRO_KEYS`.
- `data/foods.ts`: replace the 5 `*Per100g` fields on `FoodItem` with `microsPer100g: Record<string, number>`. **Migrate existing 5 values into the map for all ~150 foods, and backfill the new micros for common/high-frequency foods using USDA FoodData Central values; unknown values default to 0** (panel shows 0 until filled — acceptable and improves over time).
- `stores/tracker-store.ts`: `recomputeTotals` sums `micros` maps generically (iterate `MICRO_KEYS`) instead of 5 explicit lines. **Add a zustand persist `version` bump + `migrate()`** that maps any legacy `totalIronMg`/`ironMg`/… on persisted logs into the new `micros` map so existing user data isn't lost.
- AI scan path: find where scanned ingredients become `LoggedIngredient` (start at `app/log-meal.tsx` and the scan handler) and write into the `micros` map; AI won't return most micros, so default missing to 0.

**`components/MicroPanel.tsx`:** render rows from `MICRONUTRIENTS` instead of the hardcoded `ROWS`. Group by `mineral` / `vitamin` / `fatty_acid` with small group headers; collapsed by default showing the "N low" badge (reuse existing critical-count logic, `pct < 0.3`), expandable to the full grouped list (it's 23 rows now — keep it scannable, consider a "show all / show flagged only" toggle). Targets come from `def.rda`; `kind: 'ceiling'` nutrients (sodium) render as "stay under" (bar turns warning when *over*, not under). Keep the tap-to-learn `warning` behavior.

**Call sites:** `app/(tabs)/results.tsx` (lines 93–99 build the `micro` object) and `app/(tabs)/index.tsx` (tracker) read `todayLog.micros` directly and pass to `MicroPanel`.

---

## Workstream 2 — Supplement feature (onboarding question + daily tracking)

**Why:** User wants onboarding to ask whether they supplement, nudge non-users, and let everyone **track supplements daily** so the intake counts toward micro totals.

- **Types (`types/index.ts`):** add to `UserProfile`: `takesSupplements?: boolean; supplements?: string[];`.
- **Onboarding `app/(onboarding)/step6.tsx`:** add a new `Appear` section after "BUDGET APPROACH": "DO YOU TAKE ANY SUPPLEMENTS?" using existing `BrutalChip` yes/no; if **yes**, reveal a multi-select chip row of common supplements; if **no**, show a one-line nudge ("most people miss vit D, omega-3, magnesium & B12 from food alone — you can track these daily"). Persist via the existing `saveProfile({...savedProfile, takesSupplements, supplements})` call (line 70) and `setData(...)` (line 72). Field is optional — don't touch `isValid`/skip behavior.
- **New file — `data/supplements.ts`:** registry of common supplements, each mapping to the micros it provides:
  ```ts
  export interface SupplementDef { id: string; label: string; provides: Record<string, number>; }
  export const SUPPLEMENTS: SupplementDef[] = [
    { id: 'vitamin_d3_2000', label: 'Vitamin D3 (2000 IU)', provides: { vitaminD: 2000 } },
    { id: 'omega3_fish_oil', label: 'Omega-3 fish oil', provides: { omega3: 1.0 } },
    { id: 'multivitamin', label: 'Multivitamin', provides: { /* spread of micros */ } },
    /* magnesium, zinc, b12, iron, etc. */
  ];
  ```
- **Daily tracking (`stores/tracker-store.ts`):** add `supplementLog: Record<dateKey, string[]>` (checked supplement ids per day) + actions `toggleSupplement(dateKey, id)` and a selector for today. Fold checked supplements' `provides` into the day's micro totals — either inside `recomputeTotals` or as a derived `microsWithSupplements` selector (keep the food-only total available so the panel can show "from food vs from supplements" if desired). Persist via the existing MMKV zustand config.
- **Gap → suggestion logic:** small helper that, given recent micro totals vs RDA, returns the chronically-low `commonlyLow` micros and the `SUPPLEMENTS` that would cover them (used by the home supplement card and daily-insight engine).

---

## Workstream 3 — Expanded, verified science library + template

**Why:** Daily science pick already rotates deterministically (`EVIDENCE_CARDS[getDayOfYear() % length]` — `app/(tabs)/results.tsx:23-27,68`) and scales to any size for free. Only the content pool (30) is small.

- **`data/evidence.ts`:** grow `EVIDENCE_CARDS` from 30 → **~80–100** entries, same `EvidenceCard` shape (`id`, `claim`, `shortExplanation`, `detailedExplanation`, `confidence`, `category`, `citations[]`). **Every card must cite a real meta-analysis/systematic review with a real DOI** (CRITICAL RULE #1) — verify each citation with WebSearch during implementation; prefer Schoenfeld/Helms/Morton/Aragon-tier reviews for training & protein, Cochrane/large meta-analyses for micros & supplements. Batch authoring by topic.
- **Categories (`types/index.ts`):** extend the `category` union with the new topics needed: `'micronutrients' | 'supplements' | 'sleep' | 'recovery' | 'body_composition'` (keep existing). Update the Evidence tab filter (`app/(tabs)/evidence.tsx`) so new categories appear; confirm it still scales/scrolls at ~100 cards (add search if filtering alone feels heavy).
- **New doc — `docs/SCIENCE_LIBRARY.md`:** the authoring template (field-by-field), the category taxonomy, a citation-quality checklist (must be meta-analysis/SR, real DOI, journal+year), and a running tracker toward 200. Link it from `CLAUDE.md` §0 router.
- Optional polish: small "next pick" affordance on the home science card so users can read more than one per day (rotation stays the daily default).

---

## Workstream 4 — Home screen redesign (`app/(tabs)/results.tsx`)

**Why:** Nutrients should be the first thing seen, micros right under, and the screen should reward scrolling with genuine insight. Reorder + add modules; remove the "your targets" block (relocated to Profile).

**New section order (top → bottom):**
1. **Header** — greeting / date / goal badge (keep; strengthen type, see WS5).
2. **Calories + macros hero** (`CaloriesCard`) — *the first data block*, made more prominent: larger, `BRUTAL.shadowLg`, clearer protein/carbs/fat readout (the user's "all the nutrients first" + "make those cards more prominent").
3. **Micronutrient panel** (`MicroPanel`) — moved up to directly under the hero ("add the micronutrient card just under that"), now grouped/config-driven with the "N low" badge.
4. **Daily insight card** *(new)* — one auto-generated, actionable line per visit (new `lib/daily-insight.ts`): deterministic priority over today + recent logs — e.g. "vitamin D at 40% of target — add salmon or log your D3", "protein on point 3 days running", "you're under on fiber 4 of 5 days". Tappable to the relevant surface.
5. **Consistency / streak strip** *(new)* — logging streak + weekly consistency (reuse existing `WeeklyStreak` logic from the tracker screen).
6. **7-day trends** *(new)* — compact calories + protein mini-bars/sparkline from the last 7 daily logs (add a `recentLogs(n)` selector to `stores/tracker-store.ts`).
7. **Supplement reminder card** *(new)* — today's supplement checklist (check-offs feed micro totals, WS2); if user doesn't supplement, a gap-based nudge.
8. **Today's meals** (keep).
9. **Today's workout** (keep).
10. **Science pick (daily)** (keep; now from the expanded pool).
11. **Redo plan** (keep at bottom, or move to Profile).

**Remove "your targets" from home → relocate to Profile:** move the targets grid (BMR / maintenance / deficit-surplus / protein g·kg / fiber / water + the "why? how we ran the math" evidence chip — currently `results.tsx:154-171`, helper `TargetStat`) into `app/(tabs)/profile.tsx` as a "your targets" section, preserving the `EvidenceModal` "why" hook. Carry over the `TargetStat` sub-component and the NEAT badge.

Build each new module as a small extracted sub-component (matching the existing `CaloriesCard`/`MealsCard`/`WorkoutStatusCard` pattern in this file), wrapped in `Appear` for staggered entrance and `BrutalBox` for the neobrutalist card styling.

---

## Workstream 5 — Typography consistency + hierarchy pass

**Why:** Home already uses the brand tokens (`F.*` from `constants/fonts.ts`: Bricolage display / Hanken body / Geist Mono numbers), but the hierarchy is softer than onboarding, and two shared components leak generic `Inter`.

- Strengthen home hierarchy to match onboarding's treatment (bold-italic Bricolage section headings, Geist Mono for all numerics, Hanken for body) across the reordered/new sections.
- **Fix `Inter` leaks:** `components/MacroBar.tsx:137-146` and `components/StatCard.tsx:64-79` hardcode `Inter_*` → replace with `F.bodyBold` / `F.bodyMed` / `F.mono` equivalents.
- After fixing, check whether `Inter_*` is referenced anywhere else; if not, optionally drop it from the font load in `app/_layout.tsx` and point the NativeWind/Tailwind default `font-sans` at Hanken (`tailwind.config`) so stray classNames inherit the brand font.

---

## Workstream 6 — Calmer workout generator loader (`components/workout/GeneratingLoader.tsx`)

**Why:** The animated stickman + bouncing barbell + highlight flash reads as gimmicky. Keep what's genuinely informative (the smooth progress bar and the rotating `STAGES` labels — "reading your profile… / pulling the studies…") and drop the figure.

- Remove the stickman figure block (`figureArea`, barbell/`liftSV`/`highlightSV`, head/torso/legs styles, lines ~56–76, ~92–98, ~114–140, ~195–260).
- Keep `progressSV`, the asymptotic→spring progress fill, and the `STAGES`/`STAGE_THRESHOLDS` stage labels.
- Replace the hero visual with something subtle and on-brand: center the "building your programme." heading, cross-fade the stage label as it advances, and add a gentle looping shimmer/breathing accent on the progress fill (small opacity/translate loop, `ReduceMotion.System` respected). No bouncing. Keep the "build it yourself instead" fallback.

---

## Build order (suggested sequencing)

This is a large effort; recommended order to keep each step shippable and typecheck-clean:
1. **WS1** micronutrient refactor + migration (foundational; touches types many others depend on).
2. **WS2** supplement feature (depends on WS1's micro keys).
3. **WS5** typography + **WS6** loader (small, independent, low-risk — good to land early too).
4. **WS4** home redesign (depends on WS1/WS2 data + the daily-insight/trends selectors).
5. **WS3** science library expansion (independent content work; can run in parallel anytime).

---

## Critical files

- **Data/model:** `data/micronutrients.ts` *(new)*, `data/supplements.ts` *(new)*, `data/tracker-types.ts`, `data/foods.ts`, `data/evidence.ts`, `types/index.ts`
- **Stores:** `stores/tracker-store.ts` (micro totals, supplement log, `recentLogs`, persist migration), `stores/profile-store.ts` (supplement profile fields)
- **Logic:** `lib/daily-insight.ts` *(new)*, gap→supplement helper
- **UI — home:** `app/(tabs)/results.tsx` (reorder + new modules, remove targets), `app/(tabs)/index.tsx` (micro map read), `components/MicroPanel.tsx` (registry-driven), `app/(tabs)/profile.tsx` (relocated targets)
- **UI — onboarding:** `app/(onboarding)/step6.tsx` (supplement question)
- **UI — workout:** `components/workout/GeneratingLoader.tsx` (calmer loader)
- **Typography:** `components/MacroBar.tsx`, `components/StatCard.tsx`, optionally `app/_layout.tsx` + `tailwind.config`
- **Scan path:** `app/log-meal.tsx` + scan handler (micro map write)
- **Docs:** `docs/SCIENCE_LIBRARY.md` *(new)*, `CLAUDE.md` §0 router link

---

## Verification

1. `npm run typecheck` — must pass clean (strict; the WS1 refactor touches many typed surfaces — verify the persist `migrate()` and all micro call sites).
2. `npx expo start` and on the **home** tab:
   - Macros hero is first and prominent; micronutrient panel sits directly beneath it.
   - "Your targets" no longer on home; present on **Profile** with the working "why" evidence modal.
   - New modules render: daily insight, streak strip, 7-day trends, supplement reminder.
   - Science pick shows (temporarily hardcode `getDayOfYear` to a few values to confirm rotation across the larger pool).
3. **Micros end-to-end:** log a meal → confirm the full ~23-nutrient panel populates from food data; foods without backfilled data read 0 without errors. Reload the app → confirm a previously-saved (legacy 5-field) day migrates into the new map with no data loss.
4. **Supplements:** complete onboarding `step6` answering the supplement question both ways → verify persistence; on home, check off a supplement → confirm the covered micros increase in the panel; non-supplementing user sees the nudge.
5. **Loader:** trigger workout generation → confirm the stickman is gone and the new subtle progress + stage labels feel calm; toggle OS "reduce motion" → no looping animation.
6. **Typography:** confirm no generic `Inter` remains on home/plan surfaces (`MacroBar`/`StatCard` now brand fonts).
