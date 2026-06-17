# AGENTS.md — Tapped In Codebase Intelligence

> Single source of truth for all AI models working in this codebase. Read before touching anything. This file wins over all other instructions.
> **Last updated:** June 2026 — Supabase Auth Only + SQLite/Drizzle Relational Stack Active

---

## 0. AI ROUTER

| Doc | When |
|-----|------|
| [`docs/INTEGRATION_STATUS.md`](INTEGRATION_STATUS.md) | Migration status: scaffold vs root, MMKV vs SQLite schemas |
| [`docs/PRD.md`](PRD.md) | Living product description, math engine, and screen specifications |
| [`docs/TRACKER_SYSTEM_PLAN.md`](TRACKER_SYSTEM_PLAN.md) | Core tracker, logging flows (Voice, Barcode, Gemini Scan), and global databases |
| [`docs/WORKOUT_REVAMP_PLAN.md`](WORKOUT_REVAMP_PLAN.md) | Workout Zustand stores, sets per muscle dashboard, and routing details |
| [`docs/PLAY_STORE_LAUNCH_PLAN.md`](PLAY_STORE_LAUNCH_PLAN.md) | Codebase cleanup, Android build configs, and production readiness checks |
| [`docs/CODEBASE_INTELLIGENCE_TOOLS.md`](CODEBASE_INTELLIGENCE_TOOLS.md) | Dependency graphs, blast radius maps, and error-crashes diagnostics tracking |

**Production root only.** Scaffold removed 2026-05-17.

---

## 1. PRODUCT IDENTITY

**Tapped In** is an offline-first, evidence-based fitness OS for a **global audience** of gym-going beginners, intermediates, and desk workers.

**Core positioning:** *"Stop trusting bro science. Start being evidence-based."*

**Three unfair advantages:**
1. **Oil Tracking** — Mandatory oil/ghee/butter logging for cooked meals. The #1 hidden calorie source in cooking.
2. **NEAT-Scored Calories** — Custom 0–100 NEAT score instead of generic Harris-Benedict multipliers, calibrated for sedentary modern desk-workers globally.
3. **Evidence Layer** — Every single claim links to a peer-reviewed citation (with DOIs) built directly into the UI.

**Monetisation:**
- Free: manual tracking, 1 AI scan/day, 1 AI workout/month
- Paid: unlimited scans, AI trainer, full Science Library access

---

## 2. BUILD STATE

### ✅ Complete (V1 & Refinements)
| Feature | Notes |
|---|---|
| Rebranded Onboarding | 4 steps (A1 Basics, A2 Goal, A3 Movement, A4 Training) + TDEE Reveal |
| Rebranded Welcome | Clean, typography-led neobrutalist landing screen matching the brandbook |
| NEAT + Calorie engine | `src/calorieEngine.ts` |
| Macro engine | `src/macroEngine.ts` — protein ceiling 1.6–1.8 g/kg |
| Results tab | Hero card, MacroBar, NEAT badge, hydration, hot takes |
| Science tab & Library | Full citable EvidenceModal with direct DOI links |
| Profile tab | Goal banners, data tables, recalculations |
| Dark mode | `useColors()` neobrutalist tokens |
| Meal logger screen | Debounced local searches, recent pulls, 4-step manual flow |
| Hardened Gemini Vision AI | Photo scanning with portion previews and confidence badges |
| Advanced logger features | Voice logging, barcode scanning, carb cycling targets |
| Template Routine Builder | Preset skeletons and drag-to-reorder day customizer |

### 🔨 In Progress
| Feature | Notes |
|---|---|
| SQLite + Drizzle | Transitioning relational logs (meals, ingredients, oil, workouts, history) from flat MMKV JSON to local SQLite tables |
| MMKV data migrator | One-time script to transfer existing MMKV logs into new Drizzle SQLite schemas |
| Sets Per Muscle | Dashboard "where you're lagging" calculator (sets-this-week vs scientific target) |

---

## 3. TECH STACK

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Expo SDK 54 | Skip SDK 55 $\rightarrow$ upgrade directly to 56 (Q2 2026). |
| **Runtime** | React Native 0.81.5 | New Architecture enabled. |
| **Language** | TypeScript strict | No `any`. No unexplained type assertions. |
| **Router** | Expo Router v6 | File-based, typed routes. |
| **Fonts** | Bricolage Grotesque & Hanken Grotesk | Headings (Bricolage), Body/UI (Hanken). Geist Mono for numbers. |
| **Icons** | Lucide Icons (`lucide-react-native`) | Clean neobrutalist outlines, 1.5px stroke. |
| **Lightweight storage** | MMKV (`react-native-mmkv`) | For simple flags, settings, and profile snapshots. |
| **Relational database** | Expo SQLite + Drizzle ORM | For meals, ingredients, oil entries, workouts, and PR history. |
| **App state** | Zustand + MMKV persistence | Selector pattern mandatory. |
| **Forms & Validation** | React Hook Form + Zod | Multi-step forms and schemas. |
| **Auth** | **Supabase Auth** | No Clerk. Supabase Auth handles database RLS security and token generation. |
| **Styling** | NativeWind v4 (Tailwind CSS v3) | Responsive utility styling. |
| **Theme** | `useColors()` neobrutalist tokens | Standardized palettes. |

---

## 4. ARCHITECTURE & STATE

### State Rules

| State | Location | Tool |
|---|---|---|
| Onboarding Form | `context/onboarding-context.tsx` | React Context (transient only) |
| Profile & results | `stores/profile-store.ts` | Zustand + MMKV |
| Relational logs | `lib/db/` | Drizzle ORM + Expo SQLite |
| UI-local | `useState` | Modal controls, inputs |
| Theme | `useColors()` | Derived tokens |

### MMKV Keys

```typescript
export const STORAGE_KEYS = {
  PROFILE: 'tapped_in_profile',
  ONBOARDING_COMPLETE: 'tapped_in_onboarding_complete',
} as const;
```

---

## 5. CRITICAL DESIGN RULES (brandbook.md)

1. **Colors — useColors()**: Navy-black `#0D0F1C` (dark) or bone cream `#F2ECDE` (light). Cobalt `#2B3AFF` is the only CTA color. Acid yellow `#E8FF00` is reserved for signature highlights/milestones. 
2. **Hard shadows**: Solid offset block shadows (`shadowLg` = 8px, `shadow` = 5px, `shadowSm` = 3px). No gradients, no blur, no frosted glass.
3. **Corner nesting law**: Parent radius = `radiusLg` (14), child radius = `radius` (10). Concentric corner alignments only.
4. **Copy lowercase**: All headings/UI lowercase. Emojis and en/em dashes are completely banned. Use "to" for ranges.

---

## 6. CRITICAL RULES — NEVER VIOLATE

1. Every nutrition, calorie, or training claim must map to an EvidenceCard in `data/evidence.ts`.
2. Protein ceiling is strictly $1.8\text{ g/kg}$ max. Never inflate.
3. Never use generic Harris-Benedict multipliers. NEAT scoring only.
4. Oil check is mandatory for cooked meals — never optional.
5. AI photo scan never auto-logs; user confirms weights before saving.
6. Supabase Auth is our sole auth engine — do not add Clerk or Clerk shims.
7. Keep database logic inside `lib/db/` — never directly within UI components.
