# PRD.md — Tapped In Product Requirements Document

> Living product description and requirements for Tapped In.
> **Last updated:** June 2026

---

## 1. Product Summary

**Tapped In** is an offline-first, evidence-based fitness OS designed for a **global audience** of health-focused gym-goers and desk workers. It computes realistic, scientifically-calibrated calorie and macro targets, tracks global meals, forces transparency around cooking oils, and supports every single recommendation with peer-reviewed research.

### Core Value Proposition

> Stop trusting bro science. Start being evidence-based.

### Three Unfair Advantages
1. **Mandatory Oil Tracking** — Prompts users to log ghee, butter, and oils (the #1 source of undocumented calories).
2. **NEAT-Scored Calorie Targets** — Uses a custom $0\text{--}100$ NEAT engine with conservative activity multipliers, calibrated specifically for modern sedentary desk-workers, preventing BMR overestimations.
3. **Evidence-First UI** — Cites DOIs for every calorie, macro, hydration, and exercise recommendation.

---

## 2. Target Users

* Global gym-going beginners, intermediates, and advanced lifters.
* Desk workers, students, and professionals with low daily step counts.
* Users frustrated by crowdsourced food database errors in MyFitnessPal or HealthifyMe.
* Users looking for honest, data-driven targets rather than inflated, commercialized fitness claims.

---

## 3. Persistent Storage & Database Strategy

To guarantee speed, offline availability, and performance as logs accumulate, Tapped In implements a **local-first persistence strategy** coupled with Supabase cloud synchronizations:

| Data Type | Storage Solution | Reason |
|---|---|---|
| App flags & simple settings | MMKV | Instant synchronous key-value retrieval |
| User profile snapshot | MMKV / Zustand persisted MMKV | Fast retrieval of user dimensions |
| Core food & evidence definitions | Static TypeScript metadata | Locally compiled, type-safe references |
| Daily meal logs & ingredients | **Expo SQLite + Drizzle ORM** | Relational queries for logs and dates |
| Ghee & cooking oil entries | **Expo SQLite + Drizzle ORM** | Relational mapping to cooked meals |
| Workout plans & session logs | **Expo SQLite + Drizzle ORM** | Heavy relational queries for PRs, streaks, volume |
| Bodyweight history | **Expo SQLite + Drizzle ORM** | Time-series trends for TDEE calculations |
| Cloud backup & community | **Supabase DB & Storage** | Cross-device sync, community recipes |

### Why Expo SQLite + Drizzle ORM?
Storing long-running daily logs in flat JSON files inside MMKV causes performance degradation. Expo SQLite + Drizzle ORM offers:
* Relational table schemas (dates $\rightarrow$ logs $\rightarrow$ meals $\rightarrow$ ingredients $\rightarrow$ oil entries).
* Type-safe local writes, transactions, and schemas.
* Efficient time-series queries for the Weekly Expenditure (Adaptive TDEE) calculations.

---

## 4. Auth & Backend Security Strategy
* **Auth Engine:** **Supabase Auth** is the sole authentication provider (no Clerk integration).
* **Database Security:** Supabase Auth issues JWTs that mobile database clients pass directly to Supabase to execute secure Row Level Security (RLS) policies.
* **Backend Mediation:** Fastify API server running on Railway handles high-compute tasks, secure API operations, and Gemini generation caching.

---

## 5. Screen Specifications

### 5.1 Rebranded Welcome Screen (`app/welcome.tsx`)
* **Status:** Complete.
* **Layout:** clean, typography-led neobrutalist presentation. Highlights three core values: "no cap, it's science", "built for low-neat desk lifestyles", and "zero BS".

### 5.2 Rebranded Onboarding Flow (`app/(onboarding)/`)
* **Status:** Complete.
* **Phase A — The Math:** 4 fast screens collecting BMR & NEAT parameters (Basics $\rightarrow$ Goal $\rightarrow$ Movement $\rightarrow$ Training) designed to get to the payoff screen as fast as possible.
* **The Payoff (TDEE Reveal):** Shows the animated strike-through of generic formulas and counts up the user’s real numbers in Geist Mono inside a highlight box with a Pistachio underline draw.
* **Phase B — Dial It In:** Skippable, post-reveal screens collecting food preferences, target weights, injury workarounds, and cardio durations.

### 5.3 Daily Tracker Screen (`app/(tabs)/index.tsx`)
* **Status:** Complete.
* **UI:** Standardized under neobrutalist tokens (`radiusLg`, $3\text{px}$ borders, block shadows). Contains date navigations, `DailyMacroSummary` (remaining calories, timed progress bars, protein-per-kg indicators), collapsible `MicroPanel` showing ICMR-NIN RDA targets, inline bodyweight entries, and expandable `MealCards` grouped by type.

### 5.4 Log Meal Flow (`app/log-meal.tsx`)
* **Status:** Complete.
* **Manual logging:** 4-step flow (Name $\rightarrow$ debounced search & ingredient weights $\rightarrow$ `OilCheckModal` if cooked $\rightarrow$ review).
* **AI Photo Scan:** Gemini Vision parses plate photographs, returning editable weights, portion drafts, and oil notes in an orange UI. Non-optional oil picker is fired immediately if cooked.
* **Advanced Logging:** Includes voice logging (speech-to-text), barcode scanner, and carb cycling targets.

---

## 6. The visual brandbook.md rules
* Primary typography uses **Bricolage Grotesque** (display/headings in lowercase, tight tracking, no italics) and **Hanken Grotesk** (body/UI, 500 default). All numbers are rendered in **Geist Mono**.
* Solid, zero-blur hard block offset shadows. No gradients, glassmorphism, or frosted plates.
* concentrically nested corner radius: `radiusLg` (14) parent, `radius` (10) child.
