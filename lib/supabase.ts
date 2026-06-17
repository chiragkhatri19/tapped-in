import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl      = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Supabase sessions (access + refresh token + user metadata) can exceed the
// 2048-byte per-value limit on iOS. Values larger than CHUNK_SIZE are split
// across numbered keys so every chunk fits within the limit.
const CHUNK_SIZE = 1900;

const secureAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}__n`);
      if (!countStr) return SecureStore.getItemAsync(key);
      const n = parseInt(countStr, 10);
      const chunks = await Promise.all(
        Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(`${key}__${i}`)),
      );
      return chunks.some(c => c === null) ? null : chunks.join('');
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      await SecureStore.deleteItemAsync(`${key}__n`).catch(() => null);
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all([
      SecureStore.setItemAsync(`${key}__n`, String(chunks.length)),
      ...chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}__${i}`, chunk)),
    ]);
  },
  async removeItem(key: string): Promise<void> {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}__n`);
      const ops: Promise<void>[] = [
        SecureStore.deleteItemAsync(key).catch(() => undefined as void),
        SecureStore.deleteItemAsync(`${key}__n`).catch(() => undefined as void),
      ];
      if (countStr) {
        const n = parseInt(countStr, 10);
        for (let i = 0; i < n; i++) {
          ops.push(SecureStore.deleteItemAsync(`${key}__${i}`).catch(() => undefined as void));
        }
      }
      await Promise.all(ops);
    } catch {}
  },
};

// Supabase Auth client — owns sessions, refresh tokens, and RLS identity.
// Sessions are stored in the platform keychain (not MMKV) so they survive
// file-system extraction on rooted/jailbroken devices.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureAuthStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
    flowType:           'pkce',
  },
});
