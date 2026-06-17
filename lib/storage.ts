import { createMMKV, type MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';

const MMKV_KEY_ID = 'ti_mmkv_enc_key_v1';

// Boot instance — unencrypted, replaced by initSecureStorage() before any
// user-data-bearing component renders.
let _instance: MMKV = createMMKV({ id: 'tapped-in-storage' });

/**
 * Must be awaited at app boot (before catalog init and before any component renders).
 * On first launch it generates a random 256-bit key and persists it in the platform
 * keychain (Android Keystore / iOS Keychain) via expo-secure-store.
 */
export async function initSecureStorage(): Promise<void> {
  let key = await SecureStore.getItemAsync(MMKV_KEY_ID);
  if (!key) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    key = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync(MMKV_KEY_ID, key);
  }
  _instance = createMMKV({ id: 'tapped-in-storage', encryptionKey: key });
}

// Proxy forwards all MMKV calls to the live _instance so callers see the
// encrypted store transparently once initSecureStorage() resolves.
export const storage: MMKV = new Proxy({} as MMKV, {
  get(_, prop: string | symbol) {
    const val = (_instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function'
      ? (val as (...a: unknown[]) => unknown).bind(_instance)
      : val;
  },
}) as unknown as MMKV;

// ── Zustand persist storage adapter ──────────────────────
export const zustandMMKVStorage = {
  getItem: (name: string): string | null => {
    try {
      return storage.getString(name) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      storage.set(name, value);
    } catch {}
  },
  removeItem: (name: string): void => {
    try {
      storage.remove(name);
    } catch {}
  },
};

export const STORAGE_KEYS = {
  PROFILE: 'tapped_in_profile',
  TRACKER_LOGS: 'tapped_in_tracker_logs',
  ONBOARDING_COMPLETE: 'tapped_in_onboarding_complete',
  RECENT_FOOD_IDS: 'tapped_in_recent_food_ids',
  CUSTOM_FOODS: 'tapped_in_custom_foods',
  SAVED_MEALS: 'tapped_in_saved_meals',
  PAYWALL_SHOWN: 'tapped_in_paywall_shown',
  THEME: 'tapped_in_theme',
  // Hydration keys
  HYDRATION_SETTINGS: 'tapped_in_hydration_settings',
  // Workout keys — never rename (users lose data)
  WORKOUT_PLANS: 'tapped_in_workout_plans',
  WORKOUT_LOGS: 'tapped_in_workout_logs',
  EXERCISE_PRS: 'tapped_in_exercise_prs',
  ACTIVE_WORKOUT: 'tapped_in_active_workout',
  CUSTOM_EXERCISES: 'tapped_in_custom_exercises',
  // Sleep keys — never rename (users lose data)
  SLEEP_LOGS: 'tapped_in_sleep_logs',
  // Steps keys — never rename (users lose data)
  STEPS_LOGS: 'tapped_in_steps_logs',
  // Health connector state
  HEALTH: 'tapped_in_health',
  // WatermelonDB migration guard — never rename
  WATERMELON_MIGRATION_DONE: 'watermelon_migration_done',
  // Prompt-shown guards — keyed by date string (YYYY-MM-DD) to fire at most once per calendar day
  WEIGHT_PROMPTED_DATE: 'tapped_in_weight_prompted_date',
  DIET_PREF_BANNER_DISMISSED_DATE: 'tapped_in_diet_pref_banner_dismissed_date',
  // Evidence bookmarks — JSON string of card ID array
  EVIDENCE_BOOKMARKS: 'tapped_in_evidence_bookmarks',
  // Grace-period flag: set when step5 routes to app, cleared on first results.tsx focus
  ONBOARDING_JUST_DONE: 'tapped_in_onboarding_just_done',
} as const;

/** Returns today's date string in YYYY-MM-DD for use as a "shown today" guard. */
export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** AsyncStorage-shaped API backed by MMKV `storage` (workout/trainer legacy code). */
export const storageAsyncCompat = {
  getItem: async (key: string): Promise<string | null> =>
    storage.getString(key) ?? null,
  setItem: async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    storage.remove(key);
  },
};
