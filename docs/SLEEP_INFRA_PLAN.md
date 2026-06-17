# docs/SLEEP_INFRA_PLAN.md — Sleep/Recovery Screen, Supabase, Notifications & Launch Infra

> Plan 3 of 3 in the June 2026 expansion. Sibling plans: [HYDRATION_REVAMP_PLAN.md](HYDRATION_REVAMP_PLAN.md) · [STREAK_RINGS_PLAN.md](STREAK_RINGS_PLAN.md)
> **Goal:** Add the 4th pillar — **Sleep/Recovery** — plus the production infrastructure to ship: Supabase Auth + sync, a local-notification service, the remaining dependencies, and onboarding polish.
> **Last updated:** June 2026

---

## A. SLEEP / RECOVERY SECTION

### A.0 Decisions locked
- **Build method:** scaffold a standalone RN screen on **Replit**, export the zip, merge into the repo, then refine (saves tokens on boilerplate).
- **Data scope:** ship in two steps — **(1) manual log + quick estimate first**, then **(2) device sync (Apple Health / Android Health Connect)** as a later phase.
- **Navigation (DECIDED June 2026):** **swap Profile out of the dock for Sleep.** New dock = home · tracker · **sleep** · workout · coach (5 slots, unchanged count). **Profile moves to a top-right button on the Home header**, replacing the current goal badge (the "fat loss" pill at `results.tsx` ~line 208 that reads off-place). Rationale: users open Profile rarely but open Sleep daily, so the daily action earns the dock slot and the rarely-used one moves to a glanceable corner button.
  - `app/(tabs)/_layout.tsx`: change `<Tabs.Screen name="profile" .../>` to `name="sleep"`; profile becomes `href: null` (still routable, just off-dock).
  - `components/navigation/BrutalDock.tsx` `TABS`: replace the `profile` entry with `{ name: 'sleep', label: 'sleep', icon: 'moon-outline', accentKey: 'violet' }` (Ionicons). Keep order: results, index, sleep, workout, trainer.
  - `app/(tabs)/results.tsx`: remove the `goalBadge` View; add a top-right pressable (person-circle / avatar) → `router.push('/(tabs)/profile')`. Goal can move into the CaloriesCard subtitle if still wanted.
  - **Sequencing:** make this swap at sleep **integration time** (after the Replit zip lands) so the dock never points at a missing route.

### A.1 What the sleep screen does
1. **Manual log** — bedtime + wake time pickers → computes duration; optional quality (1–5), wake count, notes. This is the accurate path.
2. **Quick estimate** — "I slept ~X to ~Y" rough entry for users who forgot; flagged lower-confidence, still closes the Recovery ring at reduced fill.
3. **Device sync (Phase 2)** — pull last night's sleep from Apple Health (HealthKit) / Android Health Connect; auto-fills the log, user confirms.
4. **Recovery dashboard** — 7-day sleep duration bars, average, consistency (bedtime variance), debt vs target; a cited science card on sleep & recovery/hypertrophy.

> **Activity/retention upside (the business reason):** an active sleep session keeps the app foregrounded/backgrounded overnight, and bedtime/wake nudges create two more daily touchpoints. This completes the "all your pillars are tapped" positioning (nutrition + training + coach + recovery).

### A.2 Data shapes
```typescript
// data/sleep-types.ts
export interface SleepEntry {
  dateKey: string;            // the NIGHT's wake date
  bedtime: string;            // ISO
  wakeTime: string;           // ISO
  durationMin: number;
  quality?: 1|2|3|4|5;
  wakeCount?: number;
  source: 'manual' | 'estimate' | 'healthkit' | 'health_connect';
  notes?: string;
}
```
- `stores/sleep-store.ts` (Zustand + MMKV, mirrors `tracker-store` patterns; later Drizzle SQLite for history per CLAUDE.md §2).
- Feeds the **Recovery ring** in [STREAK_RINGS_PLAN.md](STREAK_RINGS_PLAN.md) and the **Coach** context.

### A.3 Sleep phases
- **Phase S1 — Replit scaffold:** generate standalone screen (use the prompt in Appendix 1). Deliver zip.
- **Phase S2 — Merge & re-skin:** drop components into `components/sleep/` + route `app/sleep.tsx`; swap scaffold primitives for `BrutalBox`/`BrutalButton`, `useColors`, fonts `F.*`; wire `sleep-store`.
- **Phase S3 — Manual + estimate logging live:** pickers, duration math, persistence, 7-day dashboard, 1 cited science card.
- **Phase S4 — Recovery ring on:** flip the flag in `completeness-engine`; Recovery ring now closes from real data.
- **Phase S5 — Device sync (later):** Apple Health + Health Connect import behind a dev build (requires `expo prebuild`). Confirm-before-save (never auto-log, mirrors AI-scan rule).

### Appendix 1 — Replit prompt
The full, copy-paste-ready Replit prompt lives in its own file: **[REPLIT_SLEEP_PROMPT.md](REPLIT_SLEEP_PROMPT.md)**. It hard-specifies our exact design tokens, component APIs, file layout, and a zip-on-completion instruction so the output integrates with zero changes.

---

## B. SUPABASE — AUTH + SYNC (do now)

CLAUDE.md §4 Rule 6: **Supabase is the sole auth provider — no Clerk.** `@supabase/supabase-js@2.105.4` is already installed; nothing is wired yet.

> ⚠️ **Memory correction:** the persisted memory `project_deployment_stack.md` says "Clerk auth + Supabase DB". That is **stale** — CLAUDE.md now mandates Supabase Auth only. This plan follows CLAUDE.md; memory will be updated.

### B.1 Phases
- **Phase B1 — Client + env:** `lib/supabase.ts` (createClient with MMKV-backed auth storage adapter, `autoRefreshToken`, `persistSession`). Env via `app.json` `extra` / `expo-constants`. Add `EXPO_PUBLIC_SUPABASE_URL` + anon key.
- **Phase B2 — Auth UI:** email/OTP (magic link) + Apple/Google sign-in (uses the `expo-auth-session`/`expo-crypto` overrides already pinned in `package.json`). New `app/(auth)/` group + an `auth-store.ts`; gate the app on session in `app/_layout.tsx`.
- **Phase B3 — Profile sync:** push onboarding `UserProfile` to a Supabase `profiles` table with **RLS** (`auth.uid() = user_id`). MMKV stays the offline-first cache; Supabase is the source of truth across devices.
- **Phase B4 — Data sync (incremental):** sync daily logs / water / sleep / workouts. Strategy: MMKV write-through → background push; last-write-wins per `dateKey` for v1 (CRDT later if needed). Keep all DB access in `lib/db/` per Rule 7.
- **Phase B5 — Backend JWT verify:** Railway Fastify (`backend/src/index.ts`) validates the Supabase JWT on `/api/scan-meal` etc.

---

## C. NOTIFICATIONS — LOCAL FIRST

`expo-notifications@0.32.17` already installed. **Local on-device scheduling only for v1** (no server, works offline). Server push deferred.

### C.1 Service
- New `lib/notifications.ts`: `requestPermission()`, `scheduleWaterReminders()`, `scheduleMealNudge()`, `scheduleBedtimeWindDown()`, `scheduleStreakRiskNudge()`, `cancelForDay()`.
- Settings screen toggles per category (in profile). Persist opt-ins in MMKV.
- **Content owners:** water reminders → [HYDRATION_REVAMP_PLAN.md](HYDRATION_REVAMP_PLAN.md) H6; streak-risk "one ring left" → [STREAK_RINGS_PLAN.md](STREAK_RINGS_PLAN.md) R5; bedtime → sleep (this doc).
- **Phases:** N1 permission + service skeleton → N2 water + meal nudges → N3 bedtime + streak-risk → N4 settings UI + quiet hours. Cancel reminders once the related goal is met that day.

> Android needs a notification channel + (SDK 54) POST_NOTIFICATIONS permission; iOS needs the prompt. Both via `expo-notifications` config — no extra native code.

---

## D. DEPENDENCIES TO ADD

| Package | For | Phase |
|---|---|---|
| `@react-native-community/datetimepicker` | Sleep bedtime/wake pickers | S2 |
| `react-native-svg` | Ring arcs (if SVG over reanimated) / charts | R2 |
| Apple Health + Health Connect lib (e.g. `react-native-health` + `react-native-health-connect`, or a unified Expo module) | Sleep device sync | S5 |
| (already installed) `expo-notifications`, `@supabase/supabase-js`, `expo-auth-session`, `expo-crypto` | — | — |

> Adding any native module (Health, datetimepicker) requires a **dev build** (`expo prebuild --clean` → `expo run:android/ios`), consistent with MMKV already needing native. Batch native additions into one prebuild.

---

## E. ONBOARDING POLISH
- Slot **auth** before/around the existing `(onboarding)` steps so a profile attaches to a Supabase user.
- Add optional hydration inputs (hot climate flag) feeding [HYDRATION_REVAMP_PLAN.md](HYDRATION_REVAMP_PLAN.md), and a sleep-target question (default 8h) feeding the Recovery ring.
- Tighten copy/validation; ensure the existing deadline-health warning logic stays.

---

## F. SENTRY / POSTHOG — DEFER (recommendation)
**Defer both to a pre-launch hardening phase.** Rationale: neither changes architecture, both are a few hours to drop in (`@sentry/react-native`, `posthog-react-native`), and adding them now creates noise while features are churning. Add Sentry first (crash visibility) right before the Play Store internal-testing track in [PLAY_STORE_LAUNCH_PLAN.md](PLAY_STORE_LAUNCH_PLAN.md); PostHog with the same release. **If you want crash data during this 10–15 day build, add Sentry only — it's cheap and isolated.**

---

## G. Suggested global sequencing (10–15 days)

| Day(s) | Focus | Plan |
|---|---|---|
| 1–2 | Hydration engine + glass `<WaterCard>` on both screens | HYDRATION H1–H4 |
| 3 | Hydration "Why" + electrolytes | HYDRATION H5 |
| 3–4 | Completeness engine + Rings card | STREAK R1–R2 |
| 4–5 | Streak + Tapped In Score, retire ConsistencyStrip | STREAK R3–R4 |
| 5 | Supabase client + auth UI | INFRA B1–B2 |
| 6 | Profile sync + RLS | INFRA B3 |
| 6–7 | Replit sleep scaffold + merge + manual/estimate live | INFRA S1–S3 |
| 8 | Recovery ring on; reinforcement/haptics | INFRA S4 + STREAK R5 |
| 8–9 | Local notifications service + settings | INFRA N1–N4 + HYDRATION H6 |
| 9–10 | Data sync (logs/water/sleep) + backend JWT | INFRA B4–B5 |
| 11–12 | Device sleep sync (HealthKit/Health Connect) | INFRA S5 |
| 12–13 | Onboarding polish | INFRA E |
| 14–15 | Sentry + buffer/QA before internal testing | INFRA F |

---

## H. Acceptance checklist
- [ ] Sleep screen merged from Replit scaffold, re-skinned to brutal system.
- [ ] Manual + estimate logging persists; 7-day recovery dashboard renders.
- [ ] Device sync (Health) confirm-before-save (Phase 2).
- [ ] Supabase Auth gates the app; profile + data sync with RLS; MMKV stays offline cache.
- [ ] Local notifications: water, meal, bedtime, streak-risk; per-category toggles + quiet hours.
- [ ] Native deps added in one prebuild; dev build runs on Android.
- [ ] Sentry added pre-launch (PostHog optional same release).
- [ ] `npm run typecheck` clean throughout.
