import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { supabaseAdmin, supabaseForUser } from '../lib/supabase';
import { logsCache } from '../lib/cache';

const DateKeyParam = z.object({ dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

const MealRow = z.object({
  id: z.string().max(100),
  date_key: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string().min(1).max(200),
  ingredients: z.string().max(50_000),  // JSON-encoded array
  oil_entry: z.string().max(10_000).nullable().optional(),
  micros: z.string().max(5_000).nullable().optional(),
  is_cooked: z.number().int().min(0).max(1).optional(),
  cooked_weight_grams: z.number().min(0).max(10_000).nullable().optional(),
  total_calories: z.number().min(0).max(50_000),
  total_protein_g: z.number().min(0).max(2_000),
  total_carbs_g: z.number().min(0).max(2_000),
  total_fat_g: z.number().min(0).max(2_000),
  log_method: z.enum(['manual', 'ai_scan']).default('manual'),
  logged_at: z.union([z.string(), z.number()]).optional().default(() => new Date().toISOString()),
  updated_at: z.union([z.string(), z.number()]).optional(),
  created_at: z.union([z.string(), z.number()]).optional(),
});

const MealBatch = z.array(MealRow).min(1).max(100);

export async function logsRoutes(app: FastifyInstance) {
  // GET /api/logs/:dateKey — daily log for a date
  app.get<{ Params: { dateKey: string } }>(
    '/api/logs/:dateKey',
    { preHandler: requireAuth },
    async (req, reply) => {
      const parsed = DateKeyParam.safeParse(req.params);
      if (!parsed.success) return reply.code(400).send({ ok: false, error: 'Invalid date' });

      const cacheKey = `logs:${req.userId}:${parsed.data.dateKey}`;
      const cached = logsCache.get(cacheKey);
      if (cached !== undefined) return reply.send({ ok: true, data: cached });

      const { data, error } = await supabaseAdmin
        .from('meal_logs')
        .select('*')
        .eq('user_id', req.userId)
        .eq('date_key', parsed.data.dateKey)
        .is('deleted_at', null)
        .order('logged_at', { ascending: true });

      if (error) {
        req.log.error(error);
        return reply.code(500).send({ ok: false, error: 'DB error' });
      }

      logsCache.set(cacheKey, data ?? []);
      return reply.send({ ok: true, data: data ?? [] });
    },
  );

  // POST /api/logs — sync a batch of logged meals
  app.post('/api/logs', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = MealBatch.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: parsed.error.message });
    }

    const rows = parsed.data.map((m) => ({
      ...m,
      user_id:    req.userId,
      logged_at:  typeof m.logged_at  === 'number' ? new Date(m.logged_at).toISOString()  : m.logged_at,
      created_at: typeof m.created_at === 'number' ? new Date(m.created_at).toISOString() : m.created_at,
      updated_at: typeof m.updated_at === 'number' ? new Date(m.updated_at).toISOString() : m.updated_at,
    }));

    // User-scoped (RLS) client: the conflict key is the client-supplied `id`, so
    // the service-role bypass would let a caller overwrite another user's meal by
    // id. RLS scopes the upsert to rows the caller owns.
    const { error } = await supabaseForUser(req.accessToken)
      .from('meal_logs')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      req.log.error(error);
      return reply.code(500).send({ ok: false, error: 'DB error' });
    }

    // Invalidate all cached dates touched by this batch
    const dates = new Set(rows.map(r => r.date_key));
    for (const d of dates) logsCache.invalidate(`logs:${req.userId}:${d}`);

    return reply.send({ ok: true, data: { synced: rows.length } });
  });

  // DELETE /api/logs/:mealId — soft-delete (tombstone for multi-device sync)
  app.delete<{ Params: { mealId: string } }>(
    '/api/logs/:mealId',
    { preHandler: requireAuth },
    async (req, reply) => {
      if (!z.string().uuid().safeParse(req.params.mealId).success) {
        return reply.code(400).send({ ok: false, error: 'Invalid meal ID' });
      }
      const now = new Date().toISOString();
      const { data: deleted, error } = await supabaseAdmin
        .from('meal_logs')
        .update({ deleted_at: now, updated_at: now })
        .eq('id', req.params.mealId)
        .eq('user_id', req.userId)
        .select('date_key')
        .single();

      if (error) {
        req.log.error(error);
        return reply.code(500).send({ ok: false, error: 'DB error' });
      }

      if (deleted?.date_key) logsCache.invalidate(`logs:${req.userId}:${deleted.date_key}`);
      return reply.send({ ok: true, data: null });
    },
  );
}
