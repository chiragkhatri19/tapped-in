import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY env var (required for RLS-scoped user writes)');
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Service-role client — has full DB access, bypasses RLS.
// Only used server-side for reads we already scope by user_id and for privileged
// operations (auth admin, account deletion). NEVER expose service_role to mobile,
// and NEVER use it for client-supplied writes keyed on a client id — see below.
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Per-request client that acts AS the authenticated user. The user's access token
// is attached as a Bearer header so PostgreSQL RLS evaluates `auth.uid()` for every
// query. This is the correct boundary for writes whose primary key is a
// client-supplied id (sync push, log upserts): RLS prevents a caller from
// overwriting another user's row even if they know/guess its id, because the
// service-role bypass does not apply here.
export function supabaseForUser(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
