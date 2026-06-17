import type { RawSleepSession, RawStepBucket, RawHRVSample, RawSpO2Session } from './types';
import type { SleepEntry } from '@/data/sleep-types';
import type { StepEntry } from '@/data/steps-types';
import { computeDurationMin } from '@/lib/sleep-utils';

function toLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sumStageMins(session: RawSleepSession, targetStage: string): number {
  if (!session.stages) return 0;
  return session.stages
    .filter((s) => s.stage === targetStage)
    .reduce((sum, s) => {
      const mins = Math.round(
        (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000,
      );
      return sum + mins;
    }, 0);
}

export function rawSleepToEntry(
  session: RawSleepSession,
  source: 'health_connect' | 'healthkit',
): SleepEntry {
  // dateKey is the WAKE date (local)
  const dateKey = toLocalDateKey(session.endTime);
  const durationMin = computeDurationMin(session.startTime, session.endTime);

  const entry: SleepEntry = {
    dateKey,
    bedtime: session.startTime,
    wakeTime: session.endTime,
    durationMin,
    source,
  };

  if (session.stages && session.stages.length > 0) {
    entry.deepMin = sumStageMins(session, 'DEEP');
    entry.remMin = sumStageMins(session, 'REM');
    entry.lightMin = sumStageMins(session, 'LIGHT');
    entry.awakeMin = sumStageMins(session, 'AWAKE');
  }

  if (session.restingHeartRate) {
    entry.restingHeartRate = session.restingHeartRate;
  }

  return entry;
}

export function rawStepsToEntry(
  bucket: RawStepBucket,
  source: 'health_connect' | 'healthkit',
): StepEntry {
  return {
    dateKey: bucket.dateKey,
    steps: bucket.steps,
    source,
    distanceM: bucket.distanceM,
    activeCalories: bucket.activeCalories,
  };
}

export function rawHRVToEntry(sample: RawHRVSample): { dateKey: string; rmssd: number } {
  return { dateKey: sample.dateKey, rmssd: sample.rmssd };
}

export function rawSpO2ToAlert(
  session: RawSpO2Session,
): { dateKey: string; minPct: number; avgPct: number; dipCount: number } {
  return {
    dateKey: session.dateKey,
    minPct: session.minPct,
    avgPct: session.avgPct,
    dipCount: session.dipsBelowNinety,
  };
}
