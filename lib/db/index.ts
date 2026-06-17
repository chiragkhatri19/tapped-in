import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { dbSchema } from './schema';
import { ALL_MODELS } from './models';

let _db: Database | null = null;

export function getDatabase(): Database {
  if (!_db) {
    const adapter = new SQLiteAdapter({
      schema: dbSchema,
      dbName: 'tapped_in_watermelon',
      jsi: true,
      onSetUpError: (err) => {
        console.error('[WatermelonDB] setup error:', err);
      },
    });

    _db = new Database({
      adapter,
      modelClasses: ALL_MODELS,
    });
  }
  return _db;
}

// Call on sign-out to wipe user data so the next user starts clean
export async function resetDatabase(): Promise<void> {
  if (_db) {
    await _db.unsafeResetDatabase();
    _db = null;
  }
}
