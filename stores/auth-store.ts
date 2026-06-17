import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { resetDatabase } from '@/lib/db/index';
import { apiClient } from '@/lib/api-client';
import { useProfileStore } from '@/stores/profile-store';

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  /** True while pulling the cloud profile for a returning user post sign-in. */
  reconciling: boolean;
  signInWithGoogle: () => Promise<string | null>;
  sendEmailOTP: (email: string) => Promise<string | null>;
  verifyEmailOTP: (email: string, token: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<string | null>;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  reconciling: false,

  signInWithGoogle: async () => {
    // Leading slash → tapped-in:///auth-callback so Android URL parsers
    // treat 'auth-callback' as the PATH, not the host.
    const redirectTo = Linking.createURL('/auth-callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error || !data.url) return error?.message ?? 'Google sign-in failed.';

    // auth-callback.tsx is the single owner of exchangeCodeForSession.
    // We only open the browser here and let the deep-link / callback route
    // complete the PKCE exchange — no double-exchange race.
    await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    return null;
  },

  sendEmailOTP: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return error?.message ?? null;
  },

  verifyEmailOTP: async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return error?.message ?? null;
  },

  deleteAccount: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return 'Not signed in';
    try {
      await apiClient.deleteAccount(session.access_token);
    } catch (err: unknown) {
      return (err as Error).message ?? 'Failed to delete account';
    }
    // Backend deleted the auth user — clear local state
    const userKeys = [
      STORAGE_KEYS.PROFILE, STORAGE_KEYS.TRACKER_LOGS, STORAGE_KEYS.WORKOUT_LOGS,
      STORAGE_KEYS.WORKOUT_PLANS, STORAGE_KEYS.EXERCISE_PRS, STORAGE_KEYS.ACTIVE_WORKOUT,
      STORAGE_KEYS.SLEEP_LOGS, STORAGE_KEYS.STEPS_LOGS, STORAGE_KEYS.CUSTOM_FOODS,
      STORAGE_KEYS.SAVED_MEALS, STORAGE_KEYS.WATERMELON_MIGRATION_DONE,
    ] as const;
    userKeys.forEach((key) => storage.remove(key));
    resetDatabase().catch(() => null);
    // Reset the in-memory profile store too, or routing keeps treating this
    // device as onboarded until the next app restart.
    useProfileStore.getState().clearProfile();
    set({ session: null, user: null, reconciling: false });
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // Wipe all user-specific MMKV data so the next user on this device starts clean
    const userKeys = [
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.TRACKER_LOGS,
      STORAGE_KEYS.WORKOUT_LOGS,
      STORAGE_KEYS.WORKOUT_PLANS,
      STORAGE_KEYS.EXERCISE_PRS,
      STORAGE_KEYS.ACTIVE_WORKOUT,
      STORAGE_KEYS.SLEEP_LOGS,
      STORAGE_KEYS.STEPS_LOGS,
      STORAGE_KEYS.CUSTOM_FOODS,
      STORAGE_KEYS.SAVED_MEALS,
      STORAGE_KEYS.WATERMELON_MIGRATION_DONE,
    ] as const;
    userKeys.forEach((key) => storage.remove(key));
    // Reset WatermelonDB so next user's data doesn't bleed through
    resetDatabase().catch(() => null);
    // Reset the in-memory profile store too, or routing keeps treating this
    // device as onboarded until the next app restart.
    useProfileStore.getState().clearProfile();
    set({ session: null, user: null, reconciling: false });
  },

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, isLoading: false });
    });

    // NOTE: the callback is intentionally NOT async. reconcileWithCloud talks to
    // the Railway API (plain fetch), never supabase.auth, so there's no risk of
    // the documented onAuthStateChange re-entrancy deadlock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null, isLoading: false });
      if (!session) { set({ reconciling: false }); return; }

      // On a real sign-in or the cold-start session restore, reconcile the
      // profile with the cloud: push local data up, or pull it down for a
      // returning user on a fresh device. The `reconciling` flag holds the
      // router on a spinner so app/index.tsx doesn't flash /welcome mid-pull.
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        set({ reconciling: true });
        useProfileStore
          .getState()
          .reconcileWithCloud(session.access_token, event === 'SIGNED_IN')
          .catch(() => null)
          .finally(() => set({ reconciling: false }));
      }
    });

    return () => subscription.unsubscribe();
  },
}));
