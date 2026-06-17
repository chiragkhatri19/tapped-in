import { Platform } from 'react-native';
import type {
  HealthAvailability, HealthPermissionStatus, HealthRange, HealthScope,
  RawSleepSession, RawStepBucket, SleepStageRecord,
  RawHRVSample, RawSpO2Session, RawWeightRecord, RawExerciseSession,
} from './types';
import type { HealthProvider } from './provider';
import type { Permission } from 'react-native-health-connect';

const HC_STAGE_MAP: Record<number, SleepStageRecord['stage']> = {
  0: 'UNKNOWN',
  1: 'AWAKE',
  2: 'SLEEPING',
  3: 'UNKNOWN',
  4: 'AWAKE',
  5: 'LIGHT',
  6: 'DEEP',
  7: 'REM',
};

// Exercise type number → readable label (Health Connect spec)
const HC_EXERCISE_MAP: Record<number, string> = {
  79: 'RUNNING', 80: 'STRENGTH_TRAINING', 37: 'CYCLING', 56: 'HIKING',
  93: 'SWIMMING_OPEN_WATER', 92: 'SWIMMING_POOL', 97: 'WALKING', 87: 'YOGA',
  1: 'BADMINTON', 2: 'BASEBALL', 4: 'BASKETBALL', 6: 'BIKING',
  10: 'BOXING', 74: 'PILATES', 78: 'ROCK_CLIMBING', 82: 'SOCCER',
  83: 'SOFTBALL', 85: 'SQUASH', 89: 'TABLE_TENNIS', 91: 'TENNIS',
};

function toLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export class HealthConnectProvider implements HealthProvider {
  readonly id = 'health_connect' as const;

  private getModule() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-health-connect') as typeof import('react-native-health-connect');
  }

  async isAvailable(): Promise<HealthAvailability> {
    if (Platform.OS !== 'android') return { available: false, reason: 'unsupported_os' };
    let hc: typeof import('react-native-health-connect');
    try { hc = this.getModule(); } catch { return { available: false, reason: 'no_module' }; }
    try {
      const status = await hc.getSdkStatus();
      if (status === 3) { await hc.initialize(); return { available: true }; }
      if (status === 2) return { available: false, reason: 'update_required' };
      return { available: false, reason: 'no_app' };
    } catch {
      return { available: false, reason: 'no_app' };
    }
  }

  async requestPermissions(scopes: HealthScope[]): Promise<HealthPermissionStatus> {
    try {
      const hc = this.getModule();
      const permissions: Permission[] = [];
      if (scopes.includes('sleep'))    permissions.push({ accessType: 'read', recordType: 'SleepSession' });
      if (scopes.includes('steps'))    permissions.push({ accessType: 'read', recordType: 'Steps' });
      if (scopes.includes('heartRate')) permissions.push({ accessType: 'read', recordType: 'HeartRate' });
      if (scopes.includes('hrv'))      permissions.push({ accessType: 'read', recordType: 'HeartRateVariabilityRmssd' });
      if (scopes.includes('spo2'))     permissions.push({ accessType: 'read', recordType: 'OxygenSaturation' });
      if (scopes.includes('weight'))   permissions.push({ accessType: 'read', recordType: 'Weight' });
      if (scopes.includes('exercise')) permissions.push({ accessType: 'read', recordType: 'ExerciseSession' });

      const result = await hc.requestPermission(permissions);
      const scopeToRecord: Record<HealthScope, string> = {
        sleep: 'SleepSession', steps: 'Steps', heartRate: 'HeartRate',
        hrv: 'HeartRateVariabilityRmssd', spo2: 'OxygenSaturation',
        weight: 'Weight', exercise: 'ExerciseSession',
      };
      const granted: HealthScope[] = [];
      const denied: HealthScope[] = [];
      for (const scope of scopes) {
        const record = scopeToRecord[scope];
        const found = result.find((r: { recordType: string; accessType: string }) => r.recordType === record && r.accessType === 'read');
        if (found) granted.push(scope); else denied.push(scope);
      }
      return { granted, denied };
    } catch {
      return { granted: [], denied: scopes };
    }
  }

  async getGrantedPermissions(): Promise<HealthScope[]> {
    try {
      const hc = this.getModule();
      const granted = await hc.getGrantedPermissions();
      const recordToScope: Record<string, HealthScope> = {
        SleepSession: 'sleep', Steps: 'steps', HeartRate: 'heartRate',
        HeartRateVariabilityRmssd: 'hrv', OxygenSaturation: 'spo2',
        Weight: 'weight', ExerciseSession: 'exercise',
      };
      const scopes: HealthScope[] = [];
      for (const p of granted) {
        const scope = recordToScope[p.recordType];
        if (scope) scopes.push(scope);
      }
      return [...new Set(scopes)];
    } catch {
      return [];
    }
  }

  async readSleep(range: HealthRange): Promise<RawSleepSession[]> {
    try {
      const hc = this.getModule();
      const result = await hc.readRecords('SleepSession', {
        timeRangeFilter: { operator: 'between', startTime: range.start.toISOString(), endTime: range.end.toISOString() },
      });
      return (result.records ?? []).map((record: Record<string, unknown>) => {
        const rawStages = (record.stages as { stage: number; startTime: string; endTime: string }[] | undefined) ?? [];
        const stages: SleepStageRecord[] = rawStages.map(s => ({
          stage: HC_STAGE_MAP[s.stage] ?? 'UNKNOWN',
          startTime: s.startTime,
          endTime: s.endTime,
        }));
        return {
          startTime: record.startTime as string,
          endTime: record.endTime as string,
          stages: stages.length > 0 ? stages : undefined,
        };
      });
    } catch { return []; }
  }

  async readSteps(range: HealthRange): Promise<RawStepBucket[]> {
    try {
      const hc = this.getModule();
      const result = await hc.readRecords('Steps', {
        timeRangeFilter: { operator: 'between', startTime: range.start.toISOString(), endTime: range.end.toISOString() },
      });
      const byDate = new Map<string, { steps: number; distanceM: number; activeCalories: number }>();
      for (const record of (result.records ?? []) as Record<string, unknown>[]) {
        const dateKey = toLocalDateKey(record.startTime as string);
        const existing = byDate.get(dateKey) ?? { steps: 0, distanceM: 0, activeCalories: 0 };
        existing.steps += (record.count as number) ?? 0;
        byDate.set(dateKey, existing);
      }
      return Array.from(byDate.entries()).map(([dateKey, data]) => ({
        dateKey, steps: data.steps,
        distanceM: data.distanceM > 0 ? data.distanceM : undefined,
        activeCalories: data.activeCalories > 0 ? data.activeCalories : undefined,
      }));
    } catch { return []; }
  }

  async readRestingHeartRate(range: HealthRange): Promise<number | null> {
    try {
      const hc = this.getModule();
      const result = await hc.readRecords('RestingHeartRate', {
        timeRangeFilter: { operator: 'between', startTime: range.start.toISOString(), endTime: range.end.toISOString() },
      });
      const records = (result.records ?? []) as Record<string, unknown>[];
      if (records.length === 0) return null;
      const latest = records[records.length - 1];
      const samples = (latest.samples as { beatsPerMinute: number }[] | undefined) ?? [];
      if (samples.length > 0) return Math.round(samples[0].beatsPerMinute);
      return null;
    } catch { return null; }
  }

  async readHRV(range: HealthRange): Promise<RawHRVSample[]> {
    try {
      const hc = this.getModule();
      const result = await hc.readRecords('HeartRateVariabilityRmssd', {
        timeRangeFilter: { operator: 'between', startTime: range.start.toISOString(), endTime: range.end.toISOString() },
      });
      // Average all readings per day (nocturnal wearable devices emit multiple samples)
      const byDate = new Map<string, number[]>();
      for (const r of (result.records ?? []) as Record<string, unknown>[]) {
        const dateKey = toLocalDateKey(r.time as string);
        const rmssd = r.heartRateVariabilityMillis as number;
        if (rmssd > 0) {
          const arr = byDate.get(dateKey) ?? [];
          arr.push(rmssd);
          byDate.set(dateKey, arr);
        }
      }
      return Array.from(byDate.entries()).map(([dateKey, vals]) => ({
        dateKey,
        rmssd: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      }));
    } catch { return []; }
  }

  async readSpO2(range: HealthRange): Promise<RawSpO2Session[]> {
    try {
      const hc = this.getModule();
      const result = await hc.readRecords('OxygenSaturation', {
        timeRangeFilter: { operator: 'between', startTime: range.start.toISOString(), endTime: range.end.toISOString() },
      });
      const byDate = new Map<string, number[]>();
      for (const r of (result.records ?? []) as Record<string, unknown>[]) {
        const dateKey = toLocalDateKey(r.time as string);
        const raw = r.percentage as number;
        // HC returns 0.0–1.0; normalise to 0–100
        const pct = raw <= 1.0 ? Math.round(raw * 100) : Math.round(raw);
        const arr = byDate.get(dateKey) ?? [];
        arr.push(pct);
        byDate.set(dateKey, arr);
      }
      return Array.from(byDate.entries()).map(([dateKey, readings]) => {
        const sorted = [...readings].sort((a, b) => a - b);
        const minPct = sorted[0] ?? 100;
        const avgPct = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
        const dipsBelowNinety = sorted.filter(p => p < 90).length;
        return { dateKey, minPct, avgPct, dipsBelowNinety };
      });
    } catch { return []; }
  }

  async readWeight(range: HealthRange): Promise<RawWeightRecord | null> {
    try {
      const hc = this.getModule();
      const result = await hc.readRecords('Weight', {
        timeRangeFilter: { operator: 'between', startTime: range.start.toISOString(), endTime: range.end.toISOString() },
      });
      const records = (result.records ?? []) as Record<string, unknown>[];
      if (records.length === 0) return null;
      const latest = records[records.length - 1];
      const weightObj = latest.weight as { inKilograms: number } | undefined;
      const weightKg = weightObj?.inKilograms ?? (latest.weight as number);
      if (!weightKg || weightKg <= 0) return null;
      return { dateKey: toLocalDateKey(latest.time as string), weightKg: Math.round(weightKg * 10) / 10 };
    } catch { return null; }
  }

  async readExerciseSessions(range: HealthRange): Promise<RawExerciseSession[]> {
    try {
      const hc = this.getModule();
      const result = await hc.readRecords('ExerciseSession', {
        timeRangeFilter: { operator: 'between', startTime: range.start.toISOString(), endTime: range.end.toISOString() },
      });
      return ((result.records ?? []) as Record<string, unknown>[]).map(r => {
        const startMs = new Date(r.startTime as string).getTime();
        const endMs   = new Date(r.endTime as string).getTime();
        const durationMin = Math.round((endMs - startMs) / 60000);
        const typeNum = r.exerciseType as number;
        return {
          dateKey: toLocalDateKey(r.startTime as string),
          type: HC_EXERCISE_MAP[typeNum] ?? `TYPE_${typeNum}`,
          durationMin,
        };
      });
    } catch { return []; }
  }
}
