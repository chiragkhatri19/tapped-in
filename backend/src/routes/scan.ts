import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { scanMealImage } from '../lib/gemini';

const ScanBody = z.object({
  imageBase64: z.string().min(100).max(700_000), // ~512 KB image in base64
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  isCooked: z.boolean(),
});

const scanRateLimit = rateLimit({ max: 20, windowMs: 60 * 60 * 1000 }); // 20/hr

export async function scanRoutes(app: FastifyInstance) {
  app.post('/api/scan-meal', { preHandler: [requireAuth, scanRateLimit] }, async (req, reply) => {
    const parsed = ScanBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: parsed.error.message });
    }

    try {
      const result = await scanMealImage(parsed.data);
      return reply.send({ ok: true, data: result });
    } catch (err) {
      req.log.error(err, 'Gemini scan failed');
      return reply.code(502).send({
        ok: false,
        error: 'Scan failed — try manual entry or retake the photo.',
      });
    }
  });
}
