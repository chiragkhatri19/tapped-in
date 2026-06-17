import { StepEntry } from '@/data/steps-types';
import { getTodayKey } from '@/lib/sleep-utils';

export function recentStepEntries(
  entries: Record<string, StepEntry>,
  days: number,
): (StepEntry | null)[] {
  const result: (StepEntry | null)[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push(entries[key] ?? null);
  }
  return result;
}

export function averageSteps(entries: (StepEntry | null)[]): number {
  const valid = entries.filter((e): e is StepEntry => e !== null);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((sum, e) => sum + e.steps, 0) / valid.length);
}

export function formatSteps(n: number): string {
  if (n >= 1000) {
    return n.toLocaleString('en-US');
  }
  return String(n);
}

/**
 * Returns a rolling average of actual daily steps over the last 7 logged days.
 * Returns null when fewer than 3 days of real data exist (caller uses onboarding preset as fallback).
 */
export function getEffectiveDailySteps(): number | null {
  try {
    // Read store state directly — this is called outside of React components
    const { useStepsStore } = require('@/stores/steps-store') as typeof import('@/stores/steps-store');
    const entries = useStepsStore.getState().entries;
    const today = new Date();
    const values: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = entries[key];
      if (entry) values.push(entry.steps);
    }
    if (values.length < 3) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  } catch {
    return null;
  }
}
