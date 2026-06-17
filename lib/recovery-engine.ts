import { SleepEntry, SLEEP_TARGET_MIN } from '@/data/sleep-types';
import { bedtimeConsistency, hasStages } from '@/lib/sleep-utils';

export type RecoveryBand = 'primed' | 'recovered' | 'running low' | 'depleted';

export interface RecoveryScore {
  score: number;           // 0..100
  band: RecoveryBand;
  driver: string;          // 1-line explanation of what moved the score
  components: {
    duration: number;      // 0..1
    consistency: number;   // 0..1 (0 when <2 nights)
    quality: number;       // 0..1 (0 when no stage/HR data)
    hrv?: number;          // 0..1 (only when RMSSD data available)
    rhr?: number;          // 0..1 (only when rolling RHR baseline available)
  };
  hasFullData: boolean;    // true when stages or resting HR present
}

export interface RecoveryScoreOptions {
  // Today's nocturnal HRV RMSSD (ms) from Health Connect
  todayRMSSD?: number;
  // Rolling 7-day RMSSD values for baseline (excluding today)
  recentRMSSDs?: number[];
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function bandFromScore(score: number): RecoveryBand {
  if (score >= 85) return 'primed';
  if (score >= 70) return 'recovered';
  if (score >= 55) return 'running low';
  return 'depleted';
}

function buildDriver(
  dur: number,
  cons: number,
  qual: number,
  hasStagesData: boolean,
  recent7Count: number,
  hrv?: number,
): string {
  if (hrv !== undefined && hrv < 0.35) return 'HRV suppressed — high stress or illness likely';
  if (dur < 0.65) return 'short sleep last night';
  if (recent7Count >= 2 && cons < 0.55) return 'bedtime all over the place';
  if (hasStagesData && qual < 0.6) return 'low deep + REM sleep';
  if (hrv !== undefined && hrv > 0.8) return 'HRV strong — good recovery';
  if (dur >= 0.9 && cons >= 0.75) return 'great sleep consistency';
  if (dur >= 0.9) return 'strong sleep duration';
  return 'keep logging to track trends';
}

/**
 * Compute a composite recovery score (0–100) from sleep + optional HRV data.
 * Formula (when HRV present): 40% duration · 25% consistency · 20% HRV vs baseline · 15% RHR vs baseline.
 * Citable: MDPI Sensors 2026, Physiol. Reports 2025.
 */
export function computeRecoveryScore(
  lastNight: SleepEntry | null,
  recent7: (SleepEntry | null)[],
  opts?: RecoveryScoreOptions,
): RecoveryScore {
  const noData: RecoveryScore = {
    score: 0,
    band: 'depleted',
    driver: 'log sleep to see your recovery score',
    components: { duration: 0, consistency: 0, quality: 0 },
    hasFullData: false,
  };

  if (!lastNight) return noData;

  // ── 1. Duration component ────────────────────────────────────────────────
  const dur = clamp(lastNight.durationMin / SLEEP_TARGET_MIN, 0, 1);

  // ── 2. Consistency component ─────────────────────────────────────────────
  const validNights = recent7.filter((e): e is SleepEntry => e !== null);
  const hasConsistency = validNights.length >= 2;
  let cons = 0;
  if (hasConsistency) {
    const { variminutes } = bedtimeConsistency(recent7);
    cons = clamp(1 - variminutes / 90, 0, 1);
  }

  // ── 3. Quality component (stages + HR) ──────────────────────────────────
  const stagesAvailable = hasStages(lastNight);
  const hrAvailable = lastNight.restingHeartRate !== undefined;
  const hasFullData = stagesAvailable || hrAvailable;
  let qual = 0;

  if (stagesAvailable) {
    const deepRemFraction = ((lastNight.deepMin ?? 0) + (lastNight.remMin ?? 0)) / lastNight.durationMin;
    const idealLow = 0.33;
    const idealHigh = 0.48;
    if (deepRemFraction >= idealLow && deepRemFraction <= idealHigh) {
      qual = 1.0;
    } else if (deepRemFraction < idealLow) {
      qual = deepRemFraction / idealLow;
    } else {
      qual = Math.max(0, 1 - (deepRemFraction - idealHigh) * 2);
    }
  }

  if (hrAvailable && lastNight.restingHeartRate) {
    const baseline = 60;
    const hrQual = clamp(baseline / lastNight.restingHeartRate, 0, 1);
    qual = stagesAvailable ? (qual + hrQual) / 2 : hrQual;
  }

  // ── 4. HRV component (RMSSD vs 7-day rolling baseline) ──────────────────
  let hrvComp: number | undefined;
  if (opts?.todayRMSSD !== undefined && opts.todayRMSSD > 0) {
    const baseline = opts.recentRMSSDs && opts.recentRMSSDs.length > 0
      ? opts.recentRMSSDs.reduce((a, b) => a + b, 0) / opts.recentRMSSDs.length
      : opts.todayRMSSD; // No history yet — use today as baseline (neutral)
    const ratio = clamp(opts.todayRMSSD / baseline, 0.5, 1.5);
    // Normalize [0.5, 1.5] → [0, 1]
    hrvComp = (ratio - 0.5) / 1.0;
  }

  // ── 5. RHR component (rolling 7-day RHR vs today) ──────────────────────
  let rhrComp: number | undefined;
  const recentRHRs = validNights
    .filter(e => e.restingHeartRate !== undefined && e.dateKey !== lastNight.dateKey)
    .map(e => e.restingHeartRate as number);
  if (recentRHRs.length >= 3 && lastNight.restingHeartRate) {
    const rollingRHR = recentRHRs.reduce((a, b) => a + b, 0) / recentRHRs.length;
    const ratio = clamp(rollingRHR / lastNight.restingHeartRate, 0.7, 1.0);
    // Normalize [0.7, 1.0] → [0, 1]
    rhrComp = (ratio - 0.7) / 0.3;
  }

  // ── 6. Weighted score ─────────────────────────────────────────────────
  let score: number;
  if (hrvComp !== undefined && rhrComp !== undefined && hasConsistency) {
    // Full formula: HRV + RHR + consistency + duration
    score = 100 * (0.40 * dur + 0.25 * cons + 0.20 * hrvComp + 0.15 * rhrComp);
  } else if (hrvComp !== undefined && hasConsistency) {
    // HRV available but no RHR baseline yet
    score = 100 * (0.45 * dur + 0.25 * cons + 0.30 * hrvComp);
  } else if (hasFullData && hasConsistency) {
    score = 100 * (0.50 * dur + 0.25 * cons + 0.25 * qual);
  } else if (hasConsistency) {
    score = 100 * (0.65 * dur + 0.35 * cons);
  } else {
    score = 100 * dur;
  }

  score = Math.round(clamp(score, 0, 100));
  const band = bandFromScore(score);
  const driver = buildDriver(dur, cons, qual, hasFullData, validNights.length, hrvComp);

  return {
    score,
    band,
    driver,
    components: { duration: dur, consistency: cons, quality: qual, hrv: hrvComp, rhr: rhrComp },
    hasFullData,
  };
}

export function recoveryBandColor(
  band: RecoveryBand,
  colors: { violet: string; teal: string; orange: string; mutedForeground: string },
): string {
  switch (band) {
    case 'primed': return colors.violet;
    case 'recovered': return colors.teal;
    case 'running low': return colors.orange;
    case 'depleted': return colors.mutedForeground;
  }
}
