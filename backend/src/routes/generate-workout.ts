import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { generateWorkoutSkeleton } from '../lib/gemini';

const SAFE_TEXT = (max: number) => z.string().max(max).transform(s => s.replace(/[\n\r]/g, ' ').trim());
const SAFE_ARRAY = (max: number) => z.array(SAFE_TEXT(100)).max(max);

const GenerateWorkoutBody = z.object({
  inputs: z.object({
    goal: SAFE_TEXT(50),
    sex: SAFE_TEXT(20),
    age: z.number().int().min(10).max(120),
    weightKg: z.number().min(20).max(500),
    daysPerWeek: z.number().int().min(1).max(7),
    sessionMinutes: z.number().int().min(15).max(300),
    weakMuscles: SAFE_ARRAY(10),
    favouriteMuscles: SAFE_ARRAY(10),
    healthConditions: SAFE_ARRAY(10),
    restDaysPerWeek: z.number().int().min(0).max(6).optional(),
    experience: z.enum(['beginner','intermediate','advanced']).optional(),
    equipment: z.enum(['full_gym','dumbbells_only','home_minimal']).optional(),
    splitLengthWeeks: z.number().int().min(1).max(52).optional(),
  }),
  exerciseMenu: SAFE_TEXT(100_000).refine(s => s.length > 0, 'exerciseMenu is required'),
});

const workoutRateLimit = rateLimit({ max: 10, windowMs: 60 * 60 * 1000 }); // 10/hr

export async function generateWorkoutRoutes(app: FastifyInstance) {
  app.post('/api/generate-workout', { preHandler: [requireAuth, workoutRateLimit] }, async (req, reply) => {
    const parsed = GenerateWorkoutBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: parsed.error.message });
    }

    try {
      const skeleton = await generateWorkoutSkeleton(parsed.data);
      return reply.send({ ok: true, data: skeleton });
    } catch (err) {
      req.log.error(err, 'Gemini workout generation failed');
      return reply.code(502).send({
        ok: false,
        error: 'Plan generation failed — try again or build your split manually.',
      });
    }
  });
}
