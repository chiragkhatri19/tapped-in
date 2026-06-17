import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage, STORAGE_KEYS } from '@/lib/storage';
import type { HydrationSettings, ElectrolyteLog, HydrationReminderEntry } from '@/data/hydration-types';

export const DEFAULT_HYDRATION_SETTINGS: HydrationSettings = {
  glassSizeMl: 250,
  presets: [200, 250, 300, 450],
  hotClimate: false,
  dailyTargetOverrideMl: undefined,
  remindersEnabled: false,
  wakeHour: 7,
  sleepHour: 22,
};

const ZERO_ELECTROLYTES: ElectrolyteLog = { sodiumMg: 0, potassiumMg: 0, magnesiumMg: 0 };

interface HydrationState {
  settings: HydrationSettings;
  electrolyteLogs: Record<string, ElectrolyteLog>;
  reminderEntries: HydrationReminderEntry[];

  updateSettings: (patch: Partial<HydrationSettings>) => void;
  addElectrolytes: (dateKey: string, patch: Partial<ElectrolyteLog>) => void;
  getElectrolytes: (dateKey: string) => ElectrolyteLog;
  setReminderEntries: (entries: HydrationReminderEntry[]) => void;
}

export const useHydrationStore = create<HydrationState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_HYDRATION_SETTINGS,
      electrolyteLogs: {},
      reminderEntries: [],

      updateSettings: (patch: Partial<HydrationSettings>) => {
        set(state => ({ settings: { ...state.settings, ...patch } }));
      },

      addElectrolytes: (dateKey: string, patch: Partial<ElectrolyteLog>) => {
        set(state => {
          const existing = state.electrolyteLogs[dateKey] ?? ZERO_ELECTROLYTES;
          return {
            electrolyteLogs: {
              ...state.electrolyteLogs,
              [dateKey]: {
                sodiumMg: existing.sodiumMg + (patch.sodiumMg ?? 0),
                potassiumMg: existing.potassiumMg + (patch.potassiumMg ?? 0),
                magnesiumMg: existing.magnesiumMg + (patch.magnesiumMg ?? 0),
              },
            },
          };
        });
      },

      getElectrolytes: (dateKey: string) => {
        return get().electrolyteLogs[dateKey] ?? ZERO_ELECTROLYTES;
      },

      setReminderEntries: (entries: HydrationReminderEntry[]) => {
        set({ reminderEntries: entries });
      },
    }),
    {
      name: STORAGE_KEYS.HYDRATION_SETTINGS,
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);
