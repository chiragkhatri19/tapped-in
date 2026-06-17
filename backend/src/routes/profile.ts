import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { profileCache } from '../lib/cache';

const ProfileBody = z.object({
  age: z.number().int().min(13).max(100),
  sex: z.enum(['male', 'female']),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  bodyFatPercent: z.number().min(3).max(60).optional(),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  trainingDaysPerWeek: z.number().int().min(0).max(7),
  cardioFrequency: z.number().int().min(0).max(7),
  cardioDurationMin: z.number().int().min(0).max(180),
  dailySteps: z.number().int().min(0).max(50000),
  sittingHoursPerDay: z.number().int().min(0).max(20),
  jobType: z.enum(['desk_job', 'light_activity', 'moderate_activity', 'heavy_labor']),
  goalMode: z.enum(['fat_loss', 'recomp', 'muscle_gain', 'maintain']),
  deficitLevel: z.enum(['mild', 'moderate', 'aggressive']).optional(),
  unitSystem: z.enum(['metric', 'imperial']).default('metric'),
});

export async function profileRoutes(app: FastifyInstance) {
  app.get('/api/profile', { preHandler: requireAuth }, async (req, reply) => {
    const cacheKey = `profile:${req.userId}`;
    const cached = profileCache.get(cacheKey);
    if (cached !== undefined) return reply.send({ ok: true, data: cached });

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      req.log.error(error);
      return reply.code(500).send({ ok: false, error: 'DB error' });
    }

    profileCache.set(cacheKey, data ?? null);
    return reply.send({ ok: true, data: data ?? null });
  });

  app.put('/api/profile', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = ProfileBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: parsed.error.message });
    }

    // Map camelCase Zod output → snake_case Postgres columns.
    // email/full_name/plan are managed by the DB trigger and admin routes —
    // never overwritten by the client fitness-data PUT.
    const row = {
      user_id:                req.userId,
      age:                    parsed.data.age,
      sex:                    parsed.data.sex,
      height_cm:              parsed.data.heightCm,
      weight_kg:              parsed.data.weightKg,
      body_fat_percent:       parsed.data.bodyFatPercent ?? null,
      experience:             parsed.data.experience,
      training_days_per_week: parsed.data.trainingDaysPerWeek,
      cardio_frequency:       parsed.data.cardioFrequency,
      cardio_duration_min:    parsed.data.cardioDurationMin,
      daily_steps:            parsed.data.dailySteps,
      sitting_hours_per_day:  parsed.data.sittingHoursPerDay,
      job_type:               parsed.data.jobType,
      goal_mode:              parsed.data.goalMode,
      deficit_level:          parsed.data.deficitLevel ?? null,
      unit_system:            parsed.data.unitSystem,
      updated_at:             new Date().toISOString(),
    };

    // Merge: keep existing email/full_name/plan from the DB row
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, plan')
      .eq('user_id', req.userId)
      .single();
    const accountFields = existing ?? {};

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ ...accountFields, ...row }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      req.log.error(error);
      return reply.code(500).send({ ok: false, error: 'DB error' });
    }

    profileCache.set(`profile:${req.userId}`, data);
    return reply.send({ ok: true, data });
  });
}
