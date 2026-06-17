import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/lib/storage';

interface StreakState {
  /** All-time best streak (days). */
  best: number;
  /** YYYY-MM-DD key of the last day that was fully complete. */
  lastCompleteDateKey: string | null;

  setBest: (n: number) => void;
  setLastCompleteDate: (key: string) => void;
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set) => ({
      best: 0,
      lastCompleteDateKey: null,

      setBest: (n) => set((s) => ({ best: Math.max(s.best, n) })),
      setLastCompleteDate: (key) => set({ lastCompleteDateKey: key }),
    }),
    {
      name: 'tapped_in_streak',
      storage: createJSONStorage(() => zustandMMKVStorage),
    },
  ),
);
