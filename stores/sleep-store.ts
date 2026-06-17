import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SleepEntry } from '@/data/sleep-types';
import { zustandMMKVStorage, STORAGE_KEYS } from '@/lib/storage';
import { getTodayKey, recentEntries } from '@/lib/sleep-utils';

interface SleepState {
  entries: Record<string, SleepEntry>;
  lastNight: () => SleepEntry | null;
  recent: (days: number) => (SleepEntry | null)[];
  upsert: (entry: SleepEntry) => void;
  remove: (dateKey: string) => void;
}

export const useSleepStore = create<SleepState>()(
  persist(
    (set, get) => ({
      entries: {},

      lastNight: () => {
        const todayKey = getTodayKey();
        return get().entries[todayKey] ?? null;
      },

      recent: (days: number) => {
        return recentEntries(get().entries, days);
      },

      upsert: (entry: SleepEntry) => {
        set((state) => ({
          entries: { ...state.entries, [entry.dateKey]: entry },
        }));
      },

      remove: (dateKey: string) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [dateKey]: _removed, ...rest } = state.entries;
          return { entries: rest };
        });
      },
    }),
    {
      name: STORAGE_KEYS.SLEEP_LOGS,
      storage: createJSONStorage(() => zustandMMKVStorage),
      version: 2,
      // v1→v2: added optional stage/HR fields — fully additive, no transform needed
      migrate: (persisted) => persisted,
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);

export function useLastNight(): SleepEntry | null {
  const entries = useSleepStore((s) => s.entries);
  return entries[getTodayKey()] ?? null;
}

export function useRecentSleep(days: number): (SleepEntry | null)[] {
  const entries = useSleepStore((s) => s.entries);
  return recentEntries(entries, days);
}
