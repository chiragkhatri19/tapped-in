/**
 * Tapped In — Coach Zustand Store
 *
 * Owns message history (persisted via MMKV).
 * Migrates the old tapped_in_tap_history AsyncStorage key on first load.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage, zustandMMKVStorage } from '@/lib/storage';
import type { CoachMessage } from '@/lib/coach/actions';
import type { ReviewMeal } from '@/lib/meal-builder';

export type PendingWorkoutAction =
  | { kind: 'generate'; inputs: { daysPerWeek?: number; sessionMinutes?: number; weakMuscles?: string[]; favouriteMuscles?: string[]; healthConditions?: string[] } }
  | { kind: 'start'; sessionName: string }
  | { kind: 'edit_plan'; planId: string; op: 'swap_exercise' | 'update_meta' | 'set_active'; patch?: Record<string, unknown> }
  | { kind: 'edit_notes'; target: 'session' | 'log'; id: string; sessionName?: string; text: string };

const COACH_HISTORY_KEY = 'tapped_in_coach_history';
const LEGACY_KEY        = 'tapped_in_tap_history';
const MAX_MESSAGES      = 50;

interface CoachState {
  messages: CoachMessage[];
  addMessage: (msg: CoachMessage) => void;
  clearMessages: () => void;
  /** Meal review data set by CoachMealCard; consumed and cleared by meal-review screen. */
  pendingMealReview: ReviewMeal[] | null;
  setPendingMealReview: (meals: ReviewMeal[]) => void;
  clearPendingMealReview: () => void;
  /** Workout action signal; consumed by workout tab on focus. Not persisted. */
  pendingWorkoutAction: PendingWorkoutAction | null;
  setPendingWorkoutAction: (action: PendingWorkoutAction) => void;
  clearPendingWorkoutAction: () => void;
  /** Whether coach should speak replies aloud (TTS). Persisted. */
  voiceOutputEnabled: boolean;
  setVoiceOutputEnabled: (enabled: boolean) => void;
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set) => ({
      messages: [],
      pendingMealReview: null,
      pendingWorkoutAction: null,
      voiceOutputEnabled: false,

      addMessage: (msg) =>
        set(state => ({
          messages: [...state.messages, msg].slice(-MAX_MESSAGES),
        })),

      clearMessages: () => set({ messages: [] }),

      setPendingMealReview: (meals) => set({ pendingMealReview: meals }),
      clearPendingMealReview: () => set({ pendingMealReview: null }),

      setPendingWorkoutAction: (action) => set({ pendingWorkoutAction: action }),
      clearPendingWorkoutAction: () => set({ pendingWorkoutAction: null }),

      setVoiceOutputEnabled: (enabled) => set({ voiceOutputEnabled: enabled }),
    }),
    {
      name: COACH_HISTORY_KEY,
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({
        messages: state.messages,
        voiceOutputEnabled: state.voiceOutputEnabled,
      }),
    }
  )
);

/** One-time migration from the old AsyncStorage-compat tap_history key. */
export function migrateLegacyCoachHistory(): void {
  const state = useCoachStore.getState();
  if (state.messages.length > 0) return; // already have data

  try {
    const raw = storage.getString(LEGACY_KEY);
    if (!raw) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    // Convert old role:'tap' to role:'coach'
    const migrated: CoachMessage[] = parsed
      .filter(m => m && typeof m.text === 'string')
      .map(m => ({
        id:        m.id        ?? String(Date.now() + Math.random()),
        role:      (m.role === 'user' ? 'user' : 'coach') as 'user' | 'coach',
        text:      m.text,
        parsed:    m.parsed,
        timestamp: m.timestamp ?? new Date().toISOString(),
      }))
      .slice(-MAX_MESSAGES);

    if (migrated.length > 0) {
      useCoachStore.setState({ messages: migrated });
    }
    // Leave the old key in place (harmless, saves a write)
  } catch {
    // Corrupt legacy data — start fresh
  }
}
