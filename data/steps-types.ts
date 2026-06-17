export type StepSource = 'health_connect' | 'healthkit';

export interface StepEntry {
  dateKey: string;   // YYYY-MM-DD
  steps: number;
  source: StepSource;
  distanceM?: number;
  activeCalories?: number;
}

export const STEPS_TARGET = 10000; // matches NEAT engine's 10k = max score cap
