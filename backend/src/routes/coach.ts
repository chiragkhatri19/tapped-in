import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { callCoachGemini } from '../lib/gemini';
import { CoachContextSchema, COACH_STATIC_INSTRUCTION, renderDynamicContext } from '../lib/coach-context';

const coachRateLimit = rateLimit({ max: 100, windowMs: 60 * 60 * 1000 }); // 100/hr

// ─── Zod schema ───────────────────────────────────────────────────────────────

const HistoryItem = z.object({
  role:      z.enum(['user', 'coach']),
  text:      z.string().max(4000),
  // parsed is intentionally excluded — client-supplied parsed objects must never be
  // injected into Gemini history as model turns (prompt injection vector)
  id:        z.string().max(100).optional(),
  timestamp: z.string().max(30).optional(),
});

const CoachBody = z.object({
  userMessage: z.string().min(1).max(2000),
  history:     z.array(HistoryItem).max(32),
  // Structured context — validated field-by-field; NO free-form prompts from client
  context:     CoachContextSchema,
});

// ─── Route ────────────────────────────────────────────────────────────────────

export async function coachRoutes(app: FastifyInstance) {
  app.post('/api/coach', { preHandler: [requireAuth, coachRateLimit] }, async (req, reply) => {
    const parsed = CoachBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: parsed.error.message });
    }

    // Build both instruction and context block server-side — client never touches these
    const staticInstruction = COACH_STATIC_INSTRUCTION;
    const dynamicContext    = renderDynamicContext(parsed.data.context);

    try {
      const result = await callCoachGemini({
        userMessage:       parsed.data.userMessage,
        history:           parsed.data.history,
        staticInstruction,
        dynamicContext,
      });
      return reply.send({ ok: true, data: result });
    } catch (err) {
      req.log.error(err, 'Gemini coach call failed');
      return reply.code(502).send({ ok: false, error: 'Coach unavailable — try again.' });
    }
  });
}
