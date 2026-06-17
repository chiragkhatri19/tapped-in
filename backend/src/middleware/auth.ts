import type { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../lib/supabase';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    accessToken: string;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ ok: false, error: 'Missing auth token' });
    return;
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    reply.code(401).send({ ok: false, error: 'Invalid or expired token' });
    return;
  }

  req.userId = user.id;
  req.accessToken = token;
}
