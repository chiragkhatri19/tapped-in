# CLAUDE.md — Tapped In

> Single source of truth. Read before touching anything. This file wins over code on architectural decisions.
> **Last updated:** June 2026 — Supabase Auth Only & SQLite/Drizzle Relational Stack

---

## 0. AI ROUTER (read first)

**Production code = repo root only.**

| Read first | When |
|------------|------|
| **[docs/PLAY_STORE_LAUNCH_PLAN.md](docs/PLAY_STORE_LAUNCH_PLAN.md)** | **Play Store release and codebase organization plans** |
| [docs/PRD.md](docs/PRD.md) | Living product requirements, target demographics, and math formulas |
| [docs/TRACKER_SYSTEM_PLAN.md](docs/TRACKER_SYSTEM_PLAN.md) | Global databases, debounced searches, and Drizzle SQLite tables |
| [docs/WORKOUT_REVAMP_PLAN.md](docs/WORKOUT_REVAMP_PLAN.md) | Workout stores, sets per muscle dashboard, and routing details |
| [docs/INTEGRATION_STATUS.md](docs/INTEGRATION_STATUS.md) | Scaffold audit, MMKV, and Zustand migrations |
| [docs/CODEBASE_INTELLIGENCE_TOOLS.md](docs/CODEBASE_INTELLIGENCE_TOOLS.md) | Dependency graphs, blast radius maps, and error-crashes diagnostics tracking |
| [docs/SCIENCE_LIBRARY.md](docs/SCIENCE_LIBRARY.md) | Evidence card authoring template, category taxonomy, and citation-quality checklist |
| [docs/HYDRATION_REVAMP_PLAN.md](docs/HYDRATION_REVAMP_PLAN.md) | Glass-based water tracker, hydration target math, electrolytes, and hydration evidence |
| [docs/STREAK_RINGS_PLAN.md](docs/STREAK_RINGS_PLAN.md) | Completeness rings, all-rings streak engine, and the Tapped In readiness score |
| [docs/SLEEP_INFRA_PLAN.md](docs/SLEEP_INFRA_PLAN.md) | Sleep/recovery screen, Supabase auth+sync, local notifications, deps, and onboarding |

```bash
npm run typecheck                    # runs strict tsc check
npx expo start                       # starts Metro bundler
```

---

## 1. PRODUCT IDENTITY (tl;dr)

- Evidence-first fitness OS for a **global audience** (not limited to India).
- **Three unfair advantages:** mandatory oil tracking for cooked meals · custom NEAT scoring (0–100) · every recommendation cites a peer-reviewed study with DOIs.
- Positioning: *"The fitness app that shows its work."*
- Replaces 4 apps: tracker + workout + coach + science library.

---

## 2. TECH STACK

### Frontend (Expo Mobile)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Expo SDK ~54 | Skip 55. Upgrade directly to 56 in Q2 2026. |
| React Native | 0.81.5 | New Architecture enabled |
| Router | Expo Router v6 | File-based, typed routes. |
| Language | TypeScript strict | No `any`. No type assertions without comment. |
| Fonts | Bricolage & Hanken | Bricolage (headings), Hanken (body/UI), Geist Mono (numbers). |
| Icons | Lucide Icons | Outline neobrutalist style, 1.5px stroke. |
| Storage | MMKV (`react-native-mmkv`) | Helper `lib/storage.ts`. For settings, flags, and quick snapshots. |
| Database | Expo SQLite + Drizzle ORM | For daily meal logs, ingredients, oil records, workouts, PRs. |
| State | Zustand | selector patterns mandatory. MMKV persistence. |
| Auth | **Supabase Auth** | No Clerk. Supabase Auth handles PostgreSQL RLS and identities. |
| Styling | NativeWind v4 (Tailwind v3) | Styling classes. Import `global.css` in `_layout.tsx`. **Rule:** `useColors()` hook is the runtime source of truth for all themed (light/dark) screens. NativeWind/Tailwind tokens in `tailwind.config.js` are an exact mirror of `constants/colors.ts` for static/new components only — never define colours in both with different values. |

### Backend (Railway API)

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js + TypeScript | `backend/` folder, deployed to Railway. |
| Framework | Fastify v5 | Server entry at `backend/src/index.ts`. |
| Auth verification | Supabase Auth | Validates Supabase JWT server-side. |
| AI | Gemini 1.5 Flash | Image scanning (`POST /api/scan-meal`) and workout skeleton plans. |

---

## 3. STATE MANAGEMENT

### Critical Gotcha: Two `UserProfile` Types

```typescript
// UI FORMAT — types/index.ts — camelCase — use everywhere in UI
interface UserProfile {
  age: number; sex: 'male' | 'female'; heightCm: number; weightKg: number;
  bodyFatPercent?: number; experience: 'beginner' | 'intermediate' | 'advanced';
  trainingDaysPerWeek: number; cardioFrequency: number;
  dailySteps: number; sittingHoursPerDay: number;
  jobType: 'desk_job' | 'light_activity' | 'moderate_activity' | 'heavy_labor';
  goalMode: 'fat_loss' | 'recomp' | 'muscle_gain' | 'maintain';
}

// ENGINE FORMAT — src/types.ts — snake_case — only inside src/
// Bridge: stores/profile-store.ts → computeResult().
```

---

## 4. CRITICAL RULES — NEVER VIOLATE

1. Every nutrition, calorie, or training claim must map to an `EvidenceCard` in `data/evidence.ts`.
2. Protein ceiling is strictly $1.8\text{ g/kg}$. Do not raise without meta-analysis citation.
3. Never use generic Harris-Benedict multipliers. NEAT scoring only.
4. Oil check is mandatory for cooked meals. Ever.
5. AI scan never auto-logs. User confirms every ingredient weight.
6. Supabase Auth is our sole auth provider. Do not add Clerk or Clerk shims.
7. Keep database logic inside `lib/db/` — never directly within UI components.

---

## 5. BUILD & RUN

```bash
npm install
npx expo start                  # dev server (Metro)
npx expo start --tunnel         # physical device via ngrok
npx expo run:android            # dev build (requires native for MMKV)
npx expo prebuild --clean       # after native changes
npx expo-doctor                 # dependency health check
```
