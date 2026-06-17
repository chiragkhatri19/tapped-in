# docs/HYDRATION_REVAMP_PLAN.md — Hydration System Revamp (Glass Tracker + Electrolytes + Science)

> Plan 1 of 3 in the June 2026 expansion. Sibling plans: [STREAK_RINGS_PLAN.md](STREAK_RINGS_PLAN.md) · [SLEEP_INFRA_PLAN.md](SLEEP_INFRA_PLAN.md)
> **Goal:** Turn the bare `+150/250/350/500` water widget into a glass-based hydration system that lives on **both** the home screen and the tracker tab, backed by real hydration science (water *and* electrolytes) and its own evidence ("Why") section.
> **Last updated:** June 2026

---

## 0. Where we are today

| Fact | Location |
|---|---|
| Water stored as `waterMl: number` on `DailyLog` | `data/tracker-types.ts` |
| Mutations `addWater(ml)` / `setWater(ml)` exist | `stores/tracker-store.ts` |
| Quick-add preset widget (`WATER_PRESETS = [150,250,350,500]`) | `app/(tabs)/index.tsx` → `WaterWidget` |
| Hydration target read as `result?.hydrationMl ?? 2500` | `app/(tabs)/index.tsx:193` |
| **No** water widget on home (`results.tsx`) | — |
| **No** hydration evidence cards / category | `data/evidence.ts` |
| **No** electrolyte tracking | — |

**Design principle:** `waterMl` (millilitres) stays the **single source of truth**. "Glasses" are a *view* over ml (`glasses = waterMl / glassSizeMl`), so we never lose precision and old logs keep working. Glass size is a user setting persisted in MMKV.

---

## 1. Hydration science we will encode (seed citations)

The app's Critical Rule #1 requires every claim to map to an `EvidenceCard` with DOIs. Authoring follows [SCIENCE_LIBRARY.md](SCIENCE_LIBRARY.md). Seed numbers and sources for the new `hydration` category:

| Claim | Number we use | Source |
|---|---|---|
| Baseline total water need | **30–35 mL/kg/day**, floored against AI values | IOM/NAM DRI 2004; EFSA 2010 |
| Adequate Intake (sanity floor/ceiling) | Men ~3.7 L, Women ~2.7 L (IOM, *total* incl. food); EFSA 2.5 L / 2.0 L (drinking + beverages) | EFSA Journal 2010;8(3):1459 (doi:10.2903/j.efsa.2010.1459) |
| ~20% of water comes from food | Subtract a food-water credit from drink target | EFSA 2010 |
| Activity / heat add-on | +500–750 mL per training hour | DGE Sports Nutrition position 2020 |
| Electrolytes matter for fluid balance & BP | Na⁺ retention, K⁺ and Mg²⁺ targets | Nutrients 2019;11(6):1362 (doi:10.3390/nu11061362) |

> ⚠️ These are **seed** values. Before merge, each card must pass the SCIENCE_LIBRARY citation-quality checklist (peer-reviewed, DOI, confidence band). Chirag is doing parallel app/competitor research — fold findings in during Phase 1.

### Hydration target formula (replaces the flat `?? 2500`)

```
baseMl      = weightKg * 32                 // mid of 30–35 mL/kg
activityMl  = trainingHoursToday * 600      // 0 if rest day
heatMl      = hotClimate ? 500 : 0          // optional onboarding flag
foodCredit  = baseMl * 0.20                 // ~20% from food
targetDrinkMl = clamp(baseMl + activityMl + heatMl - foodCredit, AI_floor, AI_ceiling)
```
Implement in `lib/hydration-engine.ts` (new) and expose `result.hydrationMl` from the existing calorie/profile bridge so both tabs read one value.

---

## 2. Phases

### Phase H1 — Hydration engine + evidence foundation
- Create `lib/hydration-engine.ts`: `computeHydrationTarget(profile, { trainingHoursToday })`, `mlToGlasses`, `glassesToMl`, electrolyte targets by weight.
- Add `hydration` category to the evidence taxonomy; author **4 seed cards**: `hydration_water_need`, `hydration_electrolytes`, `hydration_potassium`, `hydration_magnesium` in `data/evidence.ts`.
- Unit-sanity the formula against IOM/EFSA floors/ceilings.
- **Done when:** `npm run typecheck` clean; cards render in the evidence library; target value is weight-driven, not `2500`.

### Phase H2 — Glass model + settings
- Add hydration settings to MMKV (`lib/storage.ts` `STORAGE_KEYS.HYDRATION_SETTINGS`): `{ glassSizeMl, customGlassSizes, dailyTargetOverrideMl? }`. Default glass = **250 mL**; presets **200 / 250 / 300 / 450**.
- New `stores/hydration-store.ts` *or* extend `tracker-store` (decision: keep `waterMl` in `tracker-store`, put **settings + electrolytes** in a small `hydration-store`). Electrolyte intake stored per day: `{ sodiumMg, potassiumMg, magnesiumMg }` (auto-summed from logged meals' micros where available, plus manual add).
- **Done when:** glass size persists; ml↔glass conversion is lossless round-trip in tests.

### Phase H3 — Shared `<WaterCard>` component (the glass UI)
- New `components/hydration/WaterCard.tsx` — the canonical widget used on **home** and **tracker** so they look identical.
- UI (neobrutalist, matches `BrutalBox`): row of glass icons. Filled glasses = whole glasses logged; tap an empty glass to add one; tap the last filled glass to remove. **Half glass:** long-press a glass toggles half-fill (adds/removes `glassSizeMl/2`). Overflow beyond target shows extra "bonus" glasses in `colors.teal`.
- Header shows `1.5L / 2.4L` + a brutal progress bar (reuse existing `waterBar*` styles). "met" badge when target hit.
- Props: `{ variant: 'home' | 'tracker', isToday }`. Reads `waterMl`, writes via `addWater`/`setWater(glassSizeMl)`.
- **Done when:** identical component renders on both screens; tapping glasses updates the same `waterMl`.

### Phase H4 — Wire into Home + Tracker
- **Tracker (`app/(tabs)/index.tsx`):** replace `WaterWidget` with `<WaterCard variant="tracker" />`; delete dead preset code/styles.
- **Home (`app/(tabs)/results.tsx`):** insert `<WaterCard variant="home" />` as a new `Appear` block (after CaloriesCard / log-meal, before workout). Compact variant = glasses + bar, no settings affordance.
- **Done when:** home and tracker both show live, tappable glasses sharing one data source.

### Phase H5 — Hydration "Why" panel + electrolytes
- New `components/hydration/HydrationPanel.tsx` (lives on tracker under the water card, optionally a "hydration" detail route): three rings/bars for **water · electrolytes · (optional) food-water**, each tappable → opens the matching `EvidenceModal`.
- Electrolyte sub-section: shows sodium / potassium / magnesium vs targets, sourced from meal micros + a manual "+ add electrolytes" (link to existing supplements list where relevant, e.g., an electrolyte mix).
- Surface 1 rotating hydration science card (reuse the home "science pick" pattern).
- **Done when:** user can see *why* hydration ≠ just water, with cited cards.

### Phase H6 — Water reminders (local notifications)
- Defined in [SLEEP_INFRA_PLAN.md](SLEEP_INFRA_PLAN.md) §Notifications, but hydration owns the *content*: spaced reminders across waking hours, suppressed once target met. Implement the schedule hook here; the notification service lives in the infra plan.
- **Done when:** opting in schedules reminders; hitting target cancels remaining ones for the day.

---

## 3. Data shapes (new)

```typescript
// data/hydration-types.ts
export interface HydrationSettings {
  glassSizeMl: number;            // default 250
  presets: number[];              // [200,250,300,450]
  hotClimate?: boolean;           // optional onboarding flag
  dailyTargetOverrideMl?: number; // manual override
}

export interface ElectrolyteLog {   // per dateKey
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
}
```
`waterMl` stays on `DailyLog`. Glasses are derived, never stored.

---

## 4. Acceptance checklist
- [ ] Target is weight/activity-driven via `hydration-engine`, not a flat 2500.
- [ ] One `<WaterCard>` renders identically on home + tracker.
- [ ] Glass size configurable; half-glass works; ml is source of truth.
- [ ] ≥4 cited hydration evidence cards pass SCIENCE_LIBRARY checklist.
- [ ] Electrolytes (Na/K/Mg) tracked vs targets with citations.
- [ ] Hydration ring feeds the Rings system ([STREAK_RINGS_PLAN.md](STREAK_RINGS_PLAN.md)).
- [ ] `npm run typecheck` clean.
