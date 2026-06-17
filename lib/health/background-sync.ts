import { getHealthProvider } from './index';
import { rawStepsToEntry, rawSpO2ToAlert } from './mappers';
import { useHealthStore } from '@/stores/health-store';
import { useStepsStore } from '@/stores/steps-store';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Silent background health sync triggered on app foreground.
 * Only runs if already connected and last sync was >2h ago.
 * Never requests new permissions — uses only already-granted scopes.
 * Never imports sleep (sleep import is always user-initiated).
 */
export async function triggerBackgroundHealthSync(): Promise<void> {
  const health = useHealthStore.getState();
  if (!health.connected) return;

  if (health.lastSyncAt) {
    const elapsed = Date.now() - new Date(health.lastSyncAt).getTime();
    if (elapsed < TWO_HOURS_MS) return;
  }

  const provider = getHealthProvider();
  const avail = await provider.isAvailable();
  if (!avail.available) return;

  const granted = await provider.getGrantedPermissions();
  if (granted.length === 0) return;

  // Delta: start from last sync, bounded to 7 days
  const now = new Date();
  const maxStart = new Date(now.getTime() - 7 * 86400000);
  const start = health.lastSyncAt
    ? new Date(Math.max(new Date(health.lastSyncAt).getTime(), maxStart.getTime()))
    : maxStart;
  const range = { start, end: now };

  const src = provider.id === 'health_connect' ? 'health_connect' as const : 'healthkit' as const;

  const [stepsResult, hrvResult, spo2Result, weightResult] = await Promise.allSettled([
    granted.includes('steps') ? provider.readSteps(range) : Promise.resolve([]),
    granted.includes('hrv') && provider.readHRV ? provider.readHRV(range) : Promise.resolve([]),
    granted.includes('spo2') && provider.readSpO2 ? provider.readSpO2(range) : Promise.resolve([]),
    granted.includes('weight') && provider.readWeight ? provider.readWeight(range) : Promise.resolve(null),
  ]);

  const steps = useStepsStore.getState();
  if (stepsResult.status === 'fulfilled') {
    for (const b of stepsResult.value) steps.upsert(rawStepsToEntry(b, src));
  }

  if (hrvResult.status === 'fulfilled' && hrvResult.value.length > 0) {
    const entries: Record<string, number> = {};
    for (const h of hrvResult.value) entries[h.dateKey] = h.rmssd;
    health.setHrv(entries);
  }

  if (spo2Result.status === 'fulfilled' && spo2Result.value.length > 0) {
    const alerts: Record<string, { minPct: number; avgPct: number; dipCount: number }> = {};
    for (const s of spo2Result.value) {
      const a = rawSpO2ToAlert(s);
      alerts[a.dateKey] = { minPct: a.minPct, avgPct: a.avgPct, dipCount: a.dipCount };
    }
    health.setSpo2(alerts);
  }

  if (weightResult.status === 'fulfilled' && weightResult.value) {
    health.setLatestWeight(weightResult.value.weightKg);
  }

  health.setLastSync(now.toISOString());
}
