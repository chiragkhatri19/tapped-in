import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { supabaseAdmin, supabaseForUser } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// 30 syncs/min keeps normal client behaviour (sync on app-foreground + periodic)
// while blocking tight retry loops that fan out 11 Supabase queries per request
const syncRateLimit = rateLimit({ max: 30, windowMs: 60_000 });

// Tables that participate in WatermelonDB sync (must match client schema)
const SYNC_TABLES = [
  'meal_logs',
  'workouts',
  'exercise_prs',
  'workout_plans',
  'sleep_entries',
  'hydration_days',
  'cardio_logs',
  'streaks',
  'coach_messages',
  'custom_foods',
  'saved_meals',
] as const;

type SyncTable = typeof SYNC_TABLES[number];

interface PullResult {
  created: Record<string, unknown>[];
  updated: Record<string, unknown>[];
  deleted: string[];
}

type ChangesMap = Record<string, PullResult>;

// ── Pull: server → client ─────────────────────────────────────────────────────
// Returns all rows modified after `lastPulledAt` per table, split into
// created / updated / deleted (soft-delete tombstones).
const PULL_LIMIT = 10_000;

async function pullTable(
  table: SyncTable,
  userId: string,
  lastPulledAt: number | null,
): Promise<PullResult> {
  const cutoff = lastPulledAt
    ? new Date(lastPulledAt).toISOString()
    : new Date(0).toISOString();

  // All rows touched since last pull (created, updated, or soft-deleted)
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', cutoff)
    .order('updated_at', { ascending: true })
    .limit(PULL_LIMIT);

  if (error) throw new Error(`pull ${table} failed`);

  if ((data?.length ?? 0) >= PULL_LIMIT) {
    console.warn(`[sync] pullTable hit PULL_LIMIT on table=${table} for user=${userId} — implement cursor pagination`);
  }

  const created: Record<string, unknown>[] = [];
  const updated: Record<string, unknown>[] = [];
  const deleted: string[] = [];

  for (const row of data ?? []) {
    if (row.deleted_at) {
      deleted.push(row.id as string);
      continue;
    }
    // Determine created vs updated by comparing created_at with cutoff
    const isNew = lastPulledAt === null || new Date(row.created_at as string).getTime() > lastPulledAt;
    // Strip server-only columns before sending to client
    const { user_id: _u, deleted_at: _d, ...clientRow } = row;
    // WatermelonDB expects timestamps as Unix ms
    clientRow.created_at = new Date(clientRow.created_at as string).getTime();
    clientRow.updated_at = new Date(clientRow.updated_at as string).getTime();
    if ('logged_at' in clientRow && clientRow.logged_at) {
      clientRow.logged_at = new Date(clientRow.logged_at as string).getTime();
    }
    if ('achieved_at' in clientRow && clientRow.achieved_at) {
      clientRow.achieved_at = new Date(clientRow.achieved_at as string).getTime();
    }
    if ('timestamp' in clientRow && clientRow.timestamp) {
      clientRow.timestamp = new Date(clientRow.timestamp as string).getTime();
    }
    if ('bedtime' in clientRow && clientRow.bedtime) {
      clientRow.bedtime = new Date(clientRow.bedtime as string).getTime();
    }
    if ('wake_time' in clientRow && clientRow.wake_time) {
      clientRow.wake_time = new Date(clientRow.wake_time as string).getTime();
    }
    if (isNew) {
      created.push(clientRow);
    } else {
      updated.push(clientRow);
    }
  }

  return { created, updated, deleted };
}

// ── Push: client → server ─────────────────────────────────────────────────────

// Base fields every synced record must have
const BaseRecord = z.object({
  id: z.string().max(100),
  created_at: z.number().int().optional(),
  updated_at: z.number().int().optional(),
});

// Per-table Zod schemas — column names match the actual Postgres schema exactly
const TABLE_SCHEMAS: Record<SyncTable, z.ZodTypeAny> = {
  meal_logs: BaseRecord.extend({
    date_key:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    meal_type:           z.enum(['breakfast','lunch','dinner','snack','pre_workout','post_workout']).optional(),
    name:                z.string().max(200).optional(),
    ingredients:         z.union([z.string().max(50000), z.array(z.unknown())]).optional(),
    oil_entry:           z.union([z.string().max(10000), z.record(z.string(), z.unknown())]).nullable().optional(),
    micros:              z.union([z.string().max(5000), z.record(z.string(), z.unknown())]).nullable().optional(),
    is_cooked:           z.boolean().optional(),
    cooked_weight_grams: z.number().min(0).max(10000).nullable().optional(),
    total_calories:      z.number().min(0).max(50000).optional(),
    total_protein_g:     z.number().min(0).max(2000).optional(),
    total_carbs_g:       z.number().min(0).max(2000).optional(),
    total_fat_g:         z.number().min(0).max(2000).optional(),
    log_method:          z.enum(['manual','ai_scan']).optional(),
    ai_scan_confidence:  z.enum(['high','medium','low']).nullable().optional(),
    logged_at:           z.number().int().optional(),
  }),
  workouts: BaseRecord.extend({
    date:             z.string().max(10).optional(),
    session_name:     z.string().max(200).optional(),
    exercises:        z.union([z.string().max(100000), z.array(z.unknown())]).optional(),
    total_sets:       z.number().int().min(0).max(10000).optional(),
    duration_minutes: z.number().int().min(0).max(1440).nullable().optional(),
    feeling_rating:   z.number().int().min(1).max(5).nullable().optional(),
    energy_level:     z.number().int().min(1).max(5).nullable().optional(),
    sleep_last_night: z.number().min(0).max(24).nullable().optional(),
    prs_achieved:     z.union([z.string().max(10000), z.array(z.unknown())]).optional(),
    notes:            z.string().max(1000).nullable().optional(),
  }),
  exercise_prs: BaseRecord.extend({
    exercise_name: z.string().max(200).optional(),
    max_weight:    z.number().min(0).max(1000).nullable().optional(),
    max_reps:      z.number().int().min(0).max(10000).nullable().optional(),
    estimated_1rm: z.number().min(0).max(1000).nullable().optional(),
    achieved_at:   z.number().int().optional(),
  }),
  workout_plans: BaseRecord.extend({
    split_name: z.string().max(200).optional(),
    source:     z.enum(['ai_generated','manual','template']).optional(),
    plan_data:  z.union([z.string().max(500000), z.record(z.string(), z.unknown())]).optional(),
    is_active:  z.boolean().optional(),
  }),
  sleep_entries: BaseRecord.extend({
    date_key:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    bedtime:     z.number().int().optional(),
    wake_time:   z.number().int().optional(),
    duration_min:z.number().int().min(0).max(1440).optional(),
    quality:     z.number().int().min(1).max(5).nullable().optional(),
    wake_count:  z.number().int().min(0).max(100).optional(),
    source:      z.enum(['manual','estimate','healthkit','health_connect']).optional(),
    notes:       z.string().max(500).nullable().optional(),
  }),
  hydration_days: BaseRecord.extend({
    date_key:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    water_ml:     z.number().int().min(0).max(20000).optional(),
    weight_kg:    z.number().min(0).max(500).nullable().optional(),
    electrolytes: z.union([z.string().max(2000), z.record(z.string(), z.unknown())]).nullable().optional(),
  }),
  cardio_logs: BaseRecord.extend({
    date:     z.string().max(10).optional(),
    modality: z.string().max(50).optional(),
    minutes:  z.number().int().min(0).max(1440).optional(),
    avg_hr:   z.number().int().min(0).max(300).nullable().optional(),
    calories: z.number().int().min(0).max(10000).nullable().optional(),
    notes:    z.string().max(500).nullable().optional(),
  }),
  streaks: BaseRecord.extend({
    kind:       z.enum(['nutrition','workout','hydration','sleep','all_rings']).optional(),
    current:    z.number().int().min(0).optional(),
    best:       z.number().int().min(0).optional(),
    last_date:  z.string().max(10).nullable().optional(),
    ring_state: z.union([z.string().max(5000), z.record(z.string(), z.unknown())]).nullable().optional(),
  }),
  coach_messages: BaseRecord.extend({
    role:            z.enum(['user','assistant']).optional(),
    text:            z.string().max(10000).optional(),
    parsed:          z.union([z.string().max(50000), z.record(z.string(), z.unknown())]).nullable().optional(),
    conversation_id: z.string().max(100).nullable().optional(),
    timestamp:       z.number().int().optional(),
  }),
  custom_foods: BaseRecord.extend({
    name:             z.string().max(200).optional(),
    calories_per_100g:z.number().min(0).max(2000).optional(),
    protein_per_100g: z.number().min(0).max(900).optional(),
    carbs_per_100g:   z.number().min(0).max(900).optional(),
    fat_per_100g:     z.number().min(0).max(900).optional(),
    micros_per_100g:  z.union([z.string().max(5000), z.record(z.string(), z.unknown())]).nullable().optional(),
  }),
  saved_meals: BaseRecord.extend({
    name:           z.string().max(200).optional(),
    ingredients:    z.union([z.string().max(50000), z.array(z.unknown())]).optional(),
    total_calories: z.number().min(0).max(50000).nullable().optional(),
    total_protein_g:z.number().min(0).max(2000).nullable().optional(),
    total_carbs_g:  z.number().min(0).max(2000).nullable().optional(),
    total_fat_g:    z.number().min(0).max(2000).nullable().optional(),
  }),
};

// JSONB columns per table — string values are JSON.parsed before upsert
const JSONB_COLUMNS: Partial<Record<SyncTable, string[]>> = {
  meal_logs:      ['ingredients', 'oil_entry', 'micros'],
  workouts:       ['exercises', 'prs_achieved'],
  workout_plans:  ['plan_data'],
  hydration_days: ['electrolytes'],
  streaks:        ['ring_state'],
  coach_messages: ['parsed'],
  custom_foods:   ['micros_per_100g'],
  saved_meals:    ['ingredients'],
};

const TableChangesSchema = z.object({
  created: z.array(z.record(z.string(), z.unknown())).max(200).optional(),
  updated: z.array(z.record(z.string(), z.unknown())).max(200).optional(),
  deleted: z.array(z.string()).max(200).optional(),
});

interface PushRecord extends Record<string, unknown> {
  id: string;
}

interface TableChanges {
  created?: PushRecord[];
  updated?: PushRecord[];
  deleted?: string[];
}

function validatePushRecords(table: SyncTable, records: unknown[]): PushRecord[] {
  const schema = TABLE_SCHEMAS[table];
  return records.map((r, i) => {
    const result = schema.safeParse(r);
    if (!result.success) throw new Error(`Invalid record at index ${i} for table ${table}: ${result.error.message}`);
    return result.data as PushRecord;
  });
}

async function pushTable(
  db: SupabaseClient,
  table: SyncTable,
  userId: string,
  changes: TableChanges,
): Promise<void> {
  const now = new Date().toISOString();

  // Upsert created + updated rows
  const toUpsert = [...(changes.created ?? []), ...(changes.updated ?? [])];
  if (toUpsert.length > 0) {
    const jsonbCols = JSONB_COLUMNS[table] ?? [];
    const rows = toUpsert.map((r) => {
      // Normalise client timestamps (Unix ms) back to ISO
      const row: Record<string, unknown> = { ...r, user_id: userId, updated_at: now };
      if (typeof row.created_at === 'number') row.created_at = new Date(row.created_at).toISOString();
      if (typeof row.logged_at === 'number') row.logged_at = new Date(row.logged_at).toISOString();
      if (typeof row.achieved_at === 'number') row.achieved_at = new Date(row.achieved_at).toISOString();
      if (typeof row.timestamp === 'number') row.timestamp = new Date(row.timestamp).toISOString();
      if (typeof row.bedtime === 'number') row.bedtime = new Date(row.bedtime).toISOString();
      if (typeof row.wake_time === 'number') row.wake_time = new Date(row.wake_time).toISOString();
      // Parse JSONB columns — clients may send serialised JSON strings
      for (const col of jsonbCols) {
        if (typeof row[col] === 'string') {
          try { row[col] = JSON.parse(row[col] as string); } catch { /* leave as-is */ }
        }
      }
      return row;
    });

    // Writes go through the user-scoped (RLS) client so a caller can never
    // overwrite another user's row by supplying its id: RLS hides rows the caller
    // doesn't own, so an upsert targeting someone else's id fails the PK insert
    // instead of silently hijacking the row.
    const { error } = await db.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`push upsert ${table} failed`);
  }

  // Soft-delete tombstones
  const toDelete = changes.deleted ?? [];
  if (toDelete.length > 0) {
    const { error } = await db
      .from(table)
      .update({ deleted_at: now, updated_at: now })
      .in('id', toDelete)
      .eq('user_id', userId);
    if (error) throw new Error(`push delete ${table} failed`);
  }
}

// ── Route registration ────────────────────────────────────────────────────────
export async function syncRoutes(app: FastifyInstance) {
  // POST /api/sync/pull — client requests all changes since lastPulledAt
  app.post<{ Body: { lastPulledAt?: number | null } }>(
    '/api/sync/pull',
    { preHandler: [requireAuth, syncRateLimit] },
    async (req, reply) => {
      const raw = req.body?.lastPulledAt;
      const lastPulledAt: number | null =
        typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;

      try {
        // Capture timestamp BEFORE queries — any write that lands during the query
        // window has updated_at <= pullTimestamp, so the next pull won't miss it.
        const pullTimestamp = Date.now();
        const changes: ChangesMap = {};
        await Promise.all(
          SYNC_TABLES.map(async (table) => {
            changes[table] = await pullTable(table, req.userId, lastPulledAt);
          }),
        );
        return reply.send({ changes, timestamp: pullTimestamp });
      } catch (err: unknown) {
        req.log.error(err);
        return reply.code(500).send({ ok: false, error: 'Sync pull failed' });
      }
    },
  );

  // POST /api/sync/push — client pushes local changes
  app.post<{ Body: { changes: Record<string, TableChanges>; lastPulledAt?: number } }>(
    '/api/sync/push',
    { preHandler: [requireAuth, syncRateLimit] },
    async (req, reply) => {
      const { changes } = req.body ?? {};
      if (!changes || typeof changes !== 'object') {
        return reply.code(400).send({ ok: false, error: 'Missing changes' });
      }

      // Validate all tables + records before touching the DB
      const validatedChanges: Record<SyncTable, TableChanges> = {} as never;
      for (const [table, raw] of Object.entries(changes)) {
        if (!SYNC_TABLES.includes(table as SyncTable)) continue;
        const t = table as SyncTable;
        const parsed = TableChangesSchema.safeParse(raw);
        if (!parsed.success) {
          return reply.code(400).send({ ok: false, error: `Invalid changes for table ${t}` });
        }
        try {
          validatedChanges[t] = {
            created: parsed.data.created ? validatePushRecords(t, parsed.data.created) : [],
            updated: parsed.data.updated ? validatePushRecords(t, parsed.data.updated) : [],
            deleted: parsed.data.deleted ?? [],
          };
        } catch (err: unknown) {
          return reply.code(400).send({ ok: false, error: (err as Error).message });
        }
      }

      try {
        const db = supabaseForUser(req.accessToken);
        await Promise.all(
          Object.entries(validatedChanges).map(async ([table, tableChanges]) => {
            await pushTable(db, table as SyncTable, req.userId, tableChanges);
          }),
        );
        return reply.send({ ok: true });
      } catch (err: unknown) {
        req.log.error(err);
        return reply.code(500).send({ ok: false, error: 'Sync push failed' });
      }
    },
  );
}
