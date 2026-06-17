import type { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitOptions {
  max: number;       // requests per window
  windowMs: number;  // window duration in ms
}

interface Bucket { count: number; resetAt: number }

// Redis client — initialised once if REDIS_URL is set so rate limit counters
// survive container restarts and work correctly across multiple instances.
// Without REDIS_URL the middleware falls back to in-memory buckets (single
// instance only — acceptable for Railway's default single-replica deploy).
let redis: { incr(key: string): Promise<number>; expire(key: string, secs: number): Promise<number> } | null = null;

if (process.env.REDIS_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('ioredis') as typeof import('ioredis');
    const client = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    client.connect().catch(() => {
      console.warn('[rateLimit] Redis unreachable — using in-memory fallback');
      redis = null;
    });
    redis = client;
  } catch {
    console.warn('[rateLimit] ioredis not installed — using in-memory fallback');
  }
}

// Factory — returns a preHandler compatible with Fastify's type system
export function rateLimit({ max, windowMs }: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  if (!redis) {
    // Purge expired buckets every 5 minutes to prevent unbounded map growth
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of buckets) {
        if (now > bucket.resetAt) buckets.delete(key);
      }
    }, 5 * 60 * 1000);
    cleanupInterval.unref?.();
  }

  return async function rateLimitHandler(req: FastifyRequest, reply: FastifyReply) {
    const userId: string = (req as FastifyRequest & { userId?: string }).userId ?? req.ip;
    const now = Date.now();

    if (redis) {
      try {
        const redisKey = `rl:${userId}:w${windowMs}:m${max}`;
        const count = await redis.incr(redisKey);
        if (count === 1) await redis.expire(redisKey, Math.ceil(windowMs / 1000));
        if (count > max) {
          reply.code(429).send({ ok: false, error: 'Rate limit exceeded. Try again later.' });
        }
        return;
      } catch {
        // Redis transient error — fall through to in-memory
      }
    }

    const bucket = buckets.get(userId);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(userId, { count: 1, resetAt: now + windowMs });
      return;
    }
    if (bucket.count >= max) {
      reply.code(429).send({ ok: false, error: 'Rate limit exceeded. Try again later.' });
      return;
    }
    bucket.count += 1;
  };
}
