import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StepEntry } from '@/data/steps-types';
import { zustandMMKVStorage, STORAGE_KEYS } from '@/lib/storage';
import { getTodayKey } from '@/lib/sleep-utils';
import { recentStepEntries } from '@/lib/steps-utils';

interface StepsState {
  entries: Record<string, StepEntry>;
  today: () => StepEntry | null;
  recent: (days: number) => (StepEntry | null)[];
  upsert: (entry: StepEntry) => void;
  remove: (dateKey: string) => void;
}

export const useStepsStore = create<StepsState>()(
  persist(
    (set, get) => ({
      entries: {},

      today: () => {
        return get().entries[getTodayKey()] ?? null;
      },

      recent: (days: number) => {
        return recentStepEntries(get().entries, days);
      },

      upsert: (entry: StepEntry) => {
        set((state) => ({
          entries: { ...state.entries, [entry.dateKey]: entry },
        }));
        // Recalculate NEAT/maintenance calories to reflect new real step data
        try {
          // Lazy import to avoid circular dependency at module init
          const { useProfileStore } = require('@/stores/profile-store') as typeof import('@/stores/profile-store');
          const { profile } = useProfileStore.getState();
          if (profile) useProfileStore.getState().recalculate();
        } catch {}
      },

      remove: (dateKey: string) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [dateKey]: _removed, ...rest } = state.entries;
          return { entries: rest };
        });
        try {
          const { useProfileStore } = require('@/stores/profile-store') as typeof import('@/stores/profile-store');
          const { profile } = useProfileStore.getState();
          if (profile) useProfileStore.getState().recalculate();
        } catch {}
      },
    }),
    {
      name: STORAGE_KEYS.STEPS_LOGS,
      storage: createJSONStorage(() => zustandMMKVStorage),
      version: 1,
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);

export function useTodaySteps(): StepEntry | null {
  const entries = useStepsStore((s) => s.entries);
  return entries[getTodayKey()] ?? null;
}

export function useRecentSteps(days: number): (StepEntry | null)[] {
  const entries = useStepsStore((s) => s.entries);
  return recentStepEntries(entries, days);
}
