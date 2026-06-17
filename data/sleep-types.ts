export type SleepSource = 'manual' | 'estimate' | 'healthkit' | 'health_connect';

export interface SleepEntry {
  dateKey: string;      // the WAKE date in YYYY-MM-DD (the morning the user woke up)
  bedtime: string;      // ISO datetime the user fell asleep
  wakeTime: string;     // ISO datetime the user woke up
  durationMin: number;  // computed minutes asleep
  quality?: 1 | 2 | 3 | 4 | 5;
  wakeCount?: number;   // times woken during the night
  source: SleepSource;
  notes?: string;
  // Connector-populated stage breakdown (optional — manual logs never have these)
  deepMin?: number;
  remMin?: number;
  lightMin?: number;
  awakeMin?: number;
  restingHeartRate?: number; // bpm
  hrv?: number;              // ms (RMSSD)
}

export const SLEEP_TARGET_MIN = 480; // 8h default target, configurable later
