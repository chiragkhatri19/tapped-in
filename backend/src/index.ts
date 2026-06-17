import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import { scanRoutes } from './routes/scan';
import { profileRoutes } from './routes/profile';
import { logsRoutes } from './routes/logs';
import { syncRoutes } from './routes/sync';
import { generateWorkoutRoutes } from './routes/generate-workout';
import { coachRoutes } from './routes/coach';
import { accountRoutes } from './routes/account';

if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
  console.warn('[CORS] ALLOWED_ORIGINS not set — all browser origins rejected. Fine for mobile-only; set it if you add a web client.');
}

const app = Fastify({ logger: true, bodyLimit: 512 * 1024 }); // 512 KB max body

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);

await app.register(compress, { global: true });

await app.register(cors, {
  origin: (origin, cb) => {
    // Requests without an Origin header (curl, mobile apps, server-to-server)
    // are allowed here — CORS is a browser-only mechanism and cannot enforce
    // API security. requireAuth (Bearer JWT) is the actual security boundary.
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'), false);
  },
});

await app.register(helmet);

// Health check — Railway uses this
app.get('/health', async () => ({ status: 'ok', ts: Date.now() }));

await app.register(scanRoutes);
await app.register(profileRoutes);
await app.register(logsRoutes);
await app.register(syncRoutes);
await app.register(generateWorkoutRoutes);
await app.register(coachRoutes);
await app.register(accountRoutes);

const port = Number(process.env.PORT ?? 3000);
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

try {
  await app.listen({ port, host });
  console.log(`API running on ${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Keep-alive: ping own /health every 4 min so Railway never cold-starts
if (process.env.NODE_ENV === 'production') {
  const keepAliveUrl = `http://127.0.0.1:${port}/health`;
  const interval = setInterval(async () => {
    try {
      await fetch(keepAliveUrl);
    } catch {
      // ignore — server may be briefly restarting
    }
  }, 4 * 60 * 1000);
  interval.unref();
}
