# docs/WORKOUT_REVAMP_PLAN.md — Workout Section & Routine Builder Blueprint

> Core blueprint for restructuring the workout tab, eliminating async splash delays, and managing the sets-per-muscle tracking loops.
> **Last updated:** June 2026

---

## 1. Synchronous Zustand Storage Strategy

Tapping the **workout** tab previously showed a blocking `'loading'` splash screen because workout logs were retrieved via asynchronous shims. 

To achieve instant renders, we migrate all routine, log, and PR records into a synchronous **Zustand + MMKV store** (`stores/workout-store.ts` mirroring `tracker-store.ts`), backed by **Drizzle SQLite** for historical query retrieval. 

* **The Result:** The dashboard reads data synchronously on mounting, rendering **instantly already populated** with no flash of loading.

```typescript
// stores/workout-store.ts
interface WorkoutState {
  plans: WorkoutPlan[];
  logs: WorkoutLog[];
  exercisePRs: Record<string, PR>;
  activeWorkout: ActiveWorkout | null; // crash recovery
  customExercises: Exercise[];
  
  activePlan: () => WorkoutPlan | null;
  todaySession: () => Session | null;
}
```

---

## 2. Populated Brutalist Dashboard Spec

The dashboard is structured editorially with a flat neo-brutalist theme ($3\text{px}$ borders, block shadows, Geist Mono numbers):

1. **Active Workout Card (The Hero):** Displays today's session details (exercises, targets, estimated time) with a large cobalt **"start workout"** CTA. If it is a rest day, it shares a recovery prompt in the brand voice.
2. **Weekly Session Strip:** A horizontal 7-day bar chart showing workouts completed.
3. **Sets Per Muscle ("where you're lagging"):** (See §3 below). Displays color-coded bars indicating set completion levels against target ranges.
4. **What to Try:** Auto-suggests 2–3 exercises from the database for the user's single most-lagging muscle group.
5. **My Plans List:** Lists saved splits. "+ new plan" opens a routine selector (Build your own / Generate with AI).
6. **Recent Sessions:** Chronological list of the last 3 logged workouts.

---

## 3. Weak-Points Engine: Sets Per Muscle

This is the central data-driven feature of Tapped In's workout section. It displays exactly where the user stands in weekly muscle group volume.

### Fractional Volume Calculations
Sets per muscle group are computed trailing the past 7 days of workout logs using the **fractional-volume convention**:

$$\text{Weekly Sets} = \left(1.0 \times \text{Sets of Primary Muscle Exercises}\right) + \left(0.5 \times \text{Sets of Secondary Muscle Exercises}\right)$$

### Target Ranges & Status Bands
Volume is audited against standard scientific guidelines for weekly muscle hypertrophy (citing Schoenfeld et al. 2017):

| Weekly Sets | Category | Visual Representation | Target Action |
|---|---|---|---|
| $< 10\text{ sets}$ | **Lagging** | Persimmon Bar (`#FF6B4A`) | Highly under-trained. Trigger "What to Try" suggestions. |
| $10\text{ to }11\text{ sets}$ | **Low** | Taupe Bar | Approaching standard volumes. |
| $12\text{ to }20\text{ sets}$ | **Dialed** | Cobalt / Green Bar | The scientific sweet-spot for optimal growth. |
| $> 22\text{ sets}$ | **Junk Volume** | Muted Grey Bar | Excessive volume with diminishing recovery returns. |

* **Onboarding Fallback:** If the user is a new user with less than 7 days of logs, the dashboard pre-loads the lagging muscles declared by the user in Onboarding Step 2, showing a disclaimer: *"Based on what you told us. Log a week to calibrate."*

---

## 4. Curated Exercise Database (`data/exercises.ts`)

A standardized local dataset of ~200 staple compound and isolation exercises. Manual splits and AI-generated routines resolve their ingredients to this database to ensure clean PR tracking and volume math.

```typescript
export interface Exercise {
  id: string;                 // 'dumbbell_shoulder_press'
  name: string;               // 'Dumbbell Shoulder Press'
  primaryMuscle: VolumeGroup; // e.g., 'shoulders'
  secondaryMuscles: VolumeGroup[]; // e.g., ['triceps']
  equipment: Equipment;       // 'dumbbell', 'barbell', 'cable', ...
  category: 'compound' | 'isolation';
  isUnilateral: boolean;
  defaultReps: string;        // '8-12'
  defaultRestSec: number;
  cue?: string;               // simple neobrutalist form prompt
}
```

---

## 5. Completed Manual Split Routine Builder
* **Skeleton Choice:** Users choose between Push-Pull-Legs, Upper/Lower, Bro Split, Full Body, or Blank. Pre-populates default exercises from the local database.
* **Customize Day:** Supports dragging-to-reorder rows, setting targets, reps, sets, RIR (Reps In Reserve), rest timers, and swiping-to-delete.
* **Live Volume Indicator:** Shows real-time updating sets-per-muscle bars at the bottom of the builder as exercises are added, letting users immediately see their training balance before committing.

---

## 6. Hardened AI Generation (Skeleton + Client Hydration)

To solve slow generation latencies (often $20\text{--}40\text{s}$), the AI routine generator splits tasks between Fastify and the local app:

1. **Skeleton Call:** Fastify backend requests a highly structured, compact **skeleton plan** from Gemini 1.5 Flash. The prompt restricts output to valid exercise IDs, setting targets, and Rationales. Latency drops to **~5s**.
2. **Local Hydration:** The mobile client intercepts the skeleton, matches the exercise IDs against the local `data/exercises.ts` file, and populates static fields (cues, equipment, muscles, secondary muscles, and DOIs) locally.
