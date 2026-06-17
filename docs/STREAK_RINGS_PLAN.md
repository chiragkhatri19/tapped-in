# docs/STREAK_RINGS_PLAN.md — Completeness Rings, Streaks & the Tapped In Score

> Plan 2 of 3 in the June 2026 expansion. Sibling plans: [HYDRATION_REVAMP_PLAN.md](HYDRATION_REVAMP_PLAN.md) · [SLEEP_INFRA_PLAN.md](SLEEP_INFRA_PLAN.md)
> **Goal:** Two hand-in-hand home-screen cards — **(A)** four daily completeness rings (Apple-Activity-style but neobrutalist) and **(B)** a 7-day streak that only advances when all four rings close. Plus a rolling **Tapped In Score** (readiness/completeness).
> **Last updated:** June 2026

---

## 0. Why this exists

Retention research is blunt: streaks + visible daily goals are the strongest pull-back mechanic in habit apps. But a streak that counts *just opening the app* is hollow. So our rule:

> **A day counts only when the user logs all four pillars. Streak = consecutive complete days.**

This also gives us an honest "are you actually tapped in?" signal we can score and trend.

---

## 1. The four rings

| Ring | Closes when… | Data source |
|---|---|---|
| **Nutrition** | Calories within target band **and** protein ≥ target | `tracker-store` daily totals + `result.macros` |
| **Hydration** | `waterMl ≥ hydrationMl` target | `tracker-store.waterMl` + `lib/hydration-engine` ([HYDRATION_REVAMP_PLAN.md](HYDRATION_REVAMP_PLAN.md)) |
| **Training** | A workout logged today **or** today is a planned rest day (rest auto-closes) | `workout-store` logs + active plan schedule |
| **Recovery (Sleep)** | Sleep logged for last night ≥ threshold (default 7h, configurable) | `sleep-store` ([SLEEP_INFRA_PLAN.md](SLEEP_INFRA_PLAN.md)) |

Each ring returns a **0–1 fill** (partial credit) and a **closed** boolean. Partial fill drives the visual; `closed` drives the streak.

> **Sequencing note:** Sleep ships after hydration/rings. Until the sleep store exists, the Recovery ring degrades gracefully to "not tracked yet" (counts as auto-neutral, *not* blocking the streak) behind a feature flag, flipped on when [SLEEP_INFRA_PLAN.md](SLEEP_INFRA_PLAN.md) lands.

---

## 2. The completeness engine (single source of truth)

New `lib/completeness-engine.ts` — pure functions, no UI, fully unit-testable:

```typescript
export interface RingState { id: 'nutrition'|'hydration'|'training'|'recovery';
  fill: number;        // 0..1 for the visual
  closed: boolean;     // counts toward streak
  label: string; detail: string;
}
export interface DayCompleteness {
  rings: RingState[];
  ringsClosed: number;       // 0..4
  dayComplete: boolean;      // all applicable rings closed
  score: number;             // 0..100 for this day
}

export function computeDayCompleteness(dateKey, deps): DayCompleteness
export function computeStreak(days: DayCompleteness[]): { current: number; best: number }
export function computeTappedInScore(recent: DayCompleteness[]): number // rolling
```

### Per-day score (0–100)
Weighted average of ring fills (weights tunable): Nutrition 0.30 · Training 0.25 · Recovery 0.25 · Hydration 0.20. A fully-closed day = 100.

### Tapped In Score (the headline number)
Rolling **7-day average** of daily scores (configurable to 3/7/14). This is the "readiness/completeness" number — shown with a band:
`90–100 LOCKED IN · 75–89 DIALED · 60–74 STEADY · <60 SLIPPING`.

---

## 3. Persistence

- Daily completeness is **derived**, not stored (recomputed from existing stores) — avoids drift.
- Persist only: `streakBest`, `lastCompleteDateKey`, `streakFreezeUsed?` in a tiny `stores/streak-store.ts` (MMKV). Current streak is recomputed from `recentLogs` + completeness on launch so it's always honest.
- Optional later: **streak freeze** (1/week) so a single missed day doesn't nuke momentum — flagged off for v1.

---

## 4. Phases

### Phase R1 — Completeness engine
- Build `lib/completeness-engine.ts` with nutrition/hydration/training rings (recovery stubbed behind flag).
- Unit tests for ring closing, streak counting (including rest-day auto-close), score math.
- **Done when:** typecheck + logic tests pass with no UI.

### Phase R2 — `<RingsCard>` (the visual)
- New `components/home/RingsCard.tsx`: four concentric or 2×2 brutalist rings. Recommend **2×2 grid of chunky ring badges** over true concentric arcs — cleaner in the neobrutalist style and readable at small size. Each ring: thick border, fill arc via `react-native-reanimated` (already installed) or SVG; center icon (Lucide). Tap a ring → bottom sheet explaining what closes it + deep link to that tab.
- Animate fill on focus.
- **Done when:** rings reflect live data and animate.

### Phase R3 — `<StreakCard>` + Tapped In Score
- New `components/home/StreakCard.tsx`: 7-day row of fire/checkmark cells (research-backed: filled = complete day). Big current-streak number + best. Inline **Tapped In Score** dial with band label.
- Decide layout: Score can live inside StreakCard or as its own slim card directly beneath. Recommend: Streak + 7-day row in one card, Tapped In Score as a compact stat strip beneath.
- **Done when:** streak only advances on all-rings-closed days; score trends over the window.

### Phase R4 — Home integration + retire `ConsistencyStrip`
- Insert `<RingsCard>` high on home (after CaloriesCard) and `<StreakCard>` just below.
- Replace the calorie-only `ConsistencyStrip` in `app/(tabs)/results.tsx` (it's superseded — keep its 7-dot idea inside StreakCard).
- **Done when:** home tells one coherent "today's completeness + your streak" story.

### Phase R5 — Reinforcement
- Haptic + brutal confetti/stamp when the 4th ring closes ("DAY COMPLETE — streak +1").
- Optional local notification at ~8pm if 1 ring from completing ("one ring left to keep your streak") — content owned here, scheduler in [SLEEP_INFRA_PLAN.md](SLEEP_INFRA_PLAN.md).
- **Done when:** closing the day feels like an event.

---

## 5. Acceptance checklist
- [ ] `completeness-engine` is pure + unit-tested.
- [ ] 4 rings reflect nutrition/hydration/training/recovery (recovery flagged until sleep ships).
- [ ] Streak advances **only** when all applicable rings close; rest days auto-close training.
- [ ] Tapped In Score = rolling avg with named bands.
- [ ] Current streak recomputed on launch (no stored drift).
- [ ] `ConsistencyStrip` retired; home reads as one system.
- [ ] `npm run typecheck` clean.
