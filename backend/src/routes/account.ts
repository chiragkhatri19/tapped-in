import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { supabaseAdmin } from '../lib/supabase';

// 3 attempts per hour — generous for an irreversible permanent deletion
const deleteAccountRateLimit = rateLimit({ max: 3, windowMs: 60 * 60 * 1000 });

// All tables that hold user data — order doesn't matter (all deletes by user_id)
const USER_TABLES = [
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
  'profiles',
] as const;

export async function accountRoutes(app: FastifyInstance) {
  /**
   * DELETE /api/account
   * Hard-deletes all user data and removes the Supabase auth user.
   * Irreversible. Requires valid session JWT.
   */
  app.delete('/api/account', { preHandler: [requireAuth, deleteAccountRateLimit] }, async (req, reply) => {
    const userId = req.userId;

    // 1. Delete all user rows from every table
    const deleteResults = await Promise.allSettled(
      USER_TABLES.map((table) =>
        supabaseAdmin.from(table).delete().eq('user_id', userId),
      ),
    );

    const tableErrors = deleteResults
      .filter((r) => {
        if (r.status === 'rejected') return true;
        // Supabase client returns { error } on failure rather than throwing
        if (r.status === 'fulfilled' && r.value?.error) return true;
        return false;
      });

    if (tableErrors.length > 0) {
      req.log.error({ tableErrors }, 'Account deletion: some table deletes failed');
      return reply.code(500).send({ ok: false, error: 'Failed to delete account data' });
    }

    // 2. Delete the auth user (this invalidates all sessions)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      req.log.error(authError, 'Account deletion: auth user delete failed');
      return reply.code(500).send({ ok: false, error: 'Failed to delete auth account' });
    }

    req.log.info({ userId }, 'Account deleted');
    return reply.code(200).send({ ok: true, data: null });
  });
}
