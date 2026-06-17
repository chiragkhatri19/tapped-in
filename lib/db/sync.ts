import { synchronize } from '@nozbe/watermelondb/sync';
import { supabase } from '@/lib/supabase';
import { getDatabase } from './index';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function syncFetch<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Sync fetch error ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

let _syncing = false;

export async function syncDatabase(): Promise<void> {
  if (_syncing) return;
  const token = await getToken();
  if (!token) return; // not signed in

  _syncing = true;
  try {
    const db = getDatabase();
    await synchronize({
      database: db,

      pullChanges: async ({ lastPulledAt }) => {
        const result = await syncFetch<{ changes: unknown; timestamp: number }>(
          '/api/sync/pull',
          token,
          { lastPulledAt },
        );
        return { changes: result.changes as any, timestamp: result.timestamp };
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        await syncFetch('/api/sync/push', token, { changes, lastPulledAt });
      },

      // Conflict: last-write-wins — correct for single-user multi-device
      conflictResolver: (_table, local, remote, resolved) => {
        // Remote wins if server updated_at is newer
        const remoteNewer = (remote.updated_at as number) > (local.updated_at as number);
        Object.assign(resolved, remoteNewer ? remote : local);
        return resolved;
      },
    });
  } catch (err) {
    console.warn('[WatermelonDB] sync failed:', err);
  } finally {
    _syncing = false;
  }
}
