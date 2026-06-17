export type HealthScope = 'sleep' | 'steps' | 'heartRate' | 'hrv' | 'spo2' | 'weight' | 'exercise';

export interface HealthAvailability {
  available: boolean;
  reason?: 'no_module' | 'no_app' | 'update_required' | 'unsupported_os' | 'expo_go';
}

export interface HealthPermissionStatus {
  granted: HealthScope[];
  denied: HealthScope[];
}

export interface HealthRange {
  start: Date;
  end: Date;
}

export interface SleepStageRecord {
  stage: 'AWAKE' | 'LIGHT' | 'DEEP' | 'REM' | 'SLEEPING' | 'UNKNOWN';
  startTime: string;
  endTime: string;
}

export interface RawSleepSession {
  startTime: string;
  endTime: string;
  stages?: SleepStageRecord[];
  restingHeartRate?: number;
}

export interface RawStepBucket {
  dateKey: string;
  steps: number;
  distanceM?: number;
  activeCalories?: number;
}

export interface RawHRVSample {
  dateKey: string;    // YYYY-MM-DD local date of the reading
  rmssd: number;      // milliseconds
}

export interface RawSpO2Session {
  dateKey: string;
  avgPct: number;           // 0–100
  minPct: number;           // 0–100
  dipsBelowNinety: number;  // count of readings below 90%
}

export interface RawWeightRecord {
  dateKey: string;
  weightKg: number;
}

export interface RawExerciseSession {
  dateKey: string;
  type: string;           // e.g. "RUNNING", "STRENGTH_TRAINING"
  durationMin: number;
  activeCalories?: number;
  distanceM?: number;
}
