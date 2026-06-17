// Shared API contracts — imported by BOTH mobile and backend.
// Keeping request/response shapes here prevents drift between client and server.

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// --- POST /api/scan-meal ------------------------------------------------------
export interface ScanMealRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  isCooked: boolean;
}

export interface ScanMealResponse {
  dishName: string;
  ingredients: Array<{
    foodId: string;
    name: string;
    weightGrams: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>;
  overallConfidence: 'high' | 'medium' | 'low';
  notes: string | null;
}

// --- POST /api/generate-workout ----------------------------------------------
// The model returns a thin SKELETON (split + sessions of exerciseId+sets).
// The mobile client hydrates the full WorkoutPlan locally from its exercise DB,
// so the backend stays DB-agnostic — the client passes the exercise menu in.
export interface WorkoutSkeletonExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  isPriorityLift?: boolean;
  /** Lifting tempo — eccentric-pause-concentric (e.g. "2-0-1"). Optional. */
  tempo?: string;
  /** Reps-in-reserve target (1-3). Goal-driven. Optional. */
  rir?: number;
}

export interface WorkoutSkeletonSession {
  name: string;
  sessionGoal?: string;
  /** One-line reason these exercises were chosen for this user's weak/favourite muscles. */
  selectionRationale?: string;
  exercises: WorkoutSkeletonExercise[];
}

export interface WorkoutSkeleton {
  splitName: string;
  splitType?: string;
  programmeRationale?: string;
  weeklySchedule: Record<string, string>;
  sessions: WorkoutSkeletonSession[];
  hotTakes?: string[];
}

export interface GenerateWorkoutInputs {
  goal: string;
  sex: string;
  age: number;
  weightKg: number;
  daysPerWeek: number;
  sessionMinutes: number;
  weakMuscles: string[];
  favouriteMuscles: string[];
  healthConditions: string[];
  // New fields (optional for backwards compat)
  restDaysPerWeek?: number;
  experience?: 'beginner' | 'intermediate' | 'advanced';
  equipment?: 'full_gym' | 'dumbbells_only' | 'home_minimal';
  splitLengthWeeks?: number;
}

export interface GenerateWorkoutRequest {
  inputs: GenerateWorkoutInputs;
  // Compact "exerciseId by muscle" menu built client-side from the exercise DB.
  exerciseMenu: string;
}

export type GenerateWorkoutResponse = WorkoutSkeleton;
