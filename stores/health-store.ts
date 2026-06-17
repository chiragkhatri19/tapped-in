import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { zustandMMKVStorage, STORAGE_KEYS } from '@/lib/storage';

export type HealthProviderId = 'health_connect' | 'healthkit' | 'none';
export type HealthScope = 'sleep' | 'steps' | 'heartRate' | 'hrv' | 'spo2' | 'weight' | 'exercise';

export interface SpO2Alert {
  minPct: number;
  avgPct: number;
  dipCount: number;
}

interface HealthState {
  connected: boolean;
  providerId: HealthProviderId | null;
  grantedScopes: HealthScope[];
  lastSyncAt: string | null;
  // Per-day HRV (dateKey → RMSSD in ms)
  hrvEntries: Record<string, number>;
  // Per-day SpO2 alerts (dateKey → alert)
  spo2Alerts: Record<string, SpO2Alert>;
  // Latest weight pulled from Health Connect (kg)
  latestWeightKg: number | null;

  setConnected: (providerId: HealthProviderId, scopes: HealthScope[]) => void;
  setLastSync: (isoDate: string) => void;
  setHrv: (entries: Record<string, number>) => void;
  setSpo2: (alerts: Record<string, SpO2Alert>) => void;
  setLatestWeight: (kg: number) => void;
  reset: () => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set) => ({
      connected: false,
      providerId: null,
      grantedScopes: [],
      lastSyncAt: null,
      hrvEntries: {},
      spo2Alerts: {},
      latestWeightKg: null,

      setConnected: (providerId, scopes) => {
        set({ connected: true, providerId, grantedScopes: scopes });
      },

      setLastSync: (isoDate) => {
        set({ lastSyncAt: isoDate });
      },

      setHrv: (entries) => {
        set((state) => ({ hrvEntries: { ...state.hrvEntries, ...entries } }));
      },

      setSpo2: (alerts) => {
        set((state) => ({ spo2Alerts: { ...state.spo2Alerts, ...alerts } }));
      },

      setLatestWeight: (kg) => {
        set({ latestWeightKg: kg });
      },

      reset: () => {
        set({
          connected: false,
          providerId: null,
          grantedScopes: [],
          lastSyncAt: null,
          hrvEntries: {},
          spo2Alerts: {},
          latestWeightKg: null,
        });
      },
    }),
    {
      name: STORAGE_KEYS.HEALTH,
      storage: createJSONStorage(() => zustandMMKVStorage),
      version: 2,
      partialize: (state) => ({
        connected: state.connected,
        providerId: state.providerId,
        grantedScopes: state.grantedScopes,
        lastSyncAt: state.lastSyncAt,
        hrvEntries: state.hrvEntries,
        spo2Alerts: state.spo2Alerts,
        latestWeightKg: state.latestWeightKg,
      }),
    },
  ),
);

export function useHealthConnection() {
  // useShallow is required: returning a fresh object literal from a Zustand
  // selector without a shallow-equality check makes useSyncExternalStore see a
  // new snapshot on every render → "Maximum update depth exceeded" infinite loop.
  return useHealthStore(
    useShallow((s) => ({
      connected: s.connected,
      providerId: s.providerId,
      grantedScopes: s.grantedScopes,
      lastSyncAt: s.lastSyncAt,
    })),
  );
}
