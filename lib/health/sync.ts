import { getHealthProvider } from './index';
import { rawSleepToEntry, rawStepsToEntry, rawSpO2ToAlert } from './mappers';
import type { HealthScope } from './types';
import type { SleepEntry } from '@/data/sleep-types';
import type { StepEntry } from '@/data/steps-types';
import { useHealthStore, type SpO2Alert } from '@/stores/health-store';

export interface HealthSyncPayload {
  sleep: SleepEntry[];
  steps: StepEntry[];
  providerId: 'health_connect' | 'healthkit';
  hrv: Record<string, number>;           // dateKey → RMSSD ms
  spo2: Record<string, SpO2Alert>;       // dateKey → alert
  latestWeightKg: number | null;
  grantedScopes: HealthScope[];
}

export type HealthSyncError =
  | 'no_module'
  | 'no_app'
  | 'update_required'
  | 'unsupported_os'
  | 'permissions_denied'
  | 'read_failed';

export class HealthSyncException extends Error {
  constructor(public readonly code: HealthSyncError) {
    super(code);
  }
}

export async function runHealthSync(days = 7): Promise<HealthSyncPayload> {
  const provider = getHealthProvider();

  const avail = await provider.isAvailable();
  if (!avail.available) {
    const code = (avail.reason === 'no_app' || avail.reason === 'update_required')
      ? avail.reason
      : avail.reason === 'unsupported_os'
      ? 'unsupported_os'
      : 'no_module';
    throw new HealthSyncException(code);
  }

  const alreadyGranted = await provider.getGrantedPermissions();
  // Request all meaningful scopes in one dialog
  const allScopes: HealthScope[] = ['sleep', 'steps', 'hrv', 'spo2', 'weight'];
  const needed = allScopes.filter((s) => !alreadyGranted.includes(s));

  let finalGranted = alreadyGranted;
  if (needed.length > 0) {
    const { granted } = await provider.requestPermissions(needed);
    finalGranted = [...new Set([...alreadyGranted, ...granted])];
    if (!finalGranted.includes('sleep') && !finalGranted.includes('steps')) {
      throw new HealthSyncException('permissions_denied');
    }
  }

  // Delta sync: start from last successful sync if available (within `days` window)
  const lastSyncAt = useHealthStore.getState().lastSyncAt;
  const now = new Date();
  const maxStart = new Date(now.getTime() - days * 86400000);
  const start = lastSyncAt
    ? new Date(Math.max(new Date(lastSyncAt).getTime(), maxStart.getTime()))
    : maxStart;
  const range = { start, end: now };

  try {
    const src = provider.id === 'health_connect' ? 'health_connect' as const : 'healthkit' as const;

    const [rawSleep, rawSteps, rawHRV, rawSpO2, rawWeight] = await Promise.all([
      finalGranted.includes('sleep')  ? provider.readSleep(range)  : Promise.resolve([]),
      finalGranted.includes('steps')  ? provider.readSteps(range)  : Promise.resolve([]),
      finalGranted.includes('hrv')    && provider.readHRV    ? provider.readHRV(range)    : Promise.resolve([]),
      finalGranted.includes('spo2')   && provider.readSpO2   ? provider.readSpO2(range)   : Promise.resolve([]),
      finalGranted.includes('weight') && provider.readWeight ? provider.readWeight(range)  : Promise.resolve(null),
    ]);

    const hrv: Record<string, number> = {};
    for (const h of rawHRV) hrv[h.dateKey] = h.rmssd;

    const spo2: Record<string, SpO2Alert> = {};
    for (const s of rawSpO2) {
      const alert = rawSpO2ToAlert(s);
      spo2[alert.dateKey] = { minPct: alert.minPct, avgPct: alert.avgPct, dipCount: alert.dipCount };
    }

    return {
      sleep: rawSleep.map((s) => rawSleepToEntry(s, src)),
      steps: rawSteps.map((b) => rawStepsToEntry(b, src)),
      providerId: src,
      hrv,
      spo2,
      latestWeightKg: rawWeight?.weightKg ?? null,
      grantedScopes: finalGranted,
    };
  } catch (e) {
    if (e instanceof HealthSyncException) throw e;
    throw new HealthSyncException('read_failed');
  }
}

export function SYNC_ERROR_MESSAGE(code: HealthSyncError): string {
  switch (code) {
    case 'no_app': return 'Install the Health Connect app to sync.';
    case 'update_required': return 'Update Health Connect to continue.';
    case 'permissions_denied': return 'Permission denied — allow sleep & steps in Health Connect.';
    case 'unsupported_os': return 'Health sync requires Android 9+ or iOS.';
    default: return 'Health Connect unavailable on this build.';
  }
}
