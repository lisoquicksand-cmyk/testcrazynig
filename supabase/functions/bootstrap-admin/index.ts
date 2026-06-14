// Bootstrap the first admin user.
// Allowed only when zero admins exist in user_roles.
// After the first admin is created, this endpoint becomes inert.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // Always return whether bootstrap is still needed
  const { count, error: countErr } = await supabase
    .from('user_roles')
    .select('*', { head: true, count: 'exact' })
    .eq('role', 'admin');

  if (countErr) {
    console.error('count error', countErr);
    return json({ error: 'server_error' }, 500);
  }

  const needsBootstrap = (count ?? 0) === 0;

  if (req.method === 'GET') {
    return json({ needs_bootstrap: needsBootstrap });
  }

  if (!needsBootstrap) {
    return json({ error: 'already_initialized' }, 409);
  }

  // Per-IP rate limit: max 5 tries / 10 minutes
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { data: allowed } = await supabase.rpc('check_rate_limit', {
    _bucket: `bootstrap-admin:${ip}`,
    _max_hits: 5,
    _window_seconds: 600,
  });
  if (allowed === false) return json({ error: 'rate_limited' }, 429);

  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: 'invalid_body' }, 400); }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'invalid_email' }, 400);
  if (password.length < 8) return json({ error: 'weak_password' }, 400);

  // Create user
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    console.error('create user error', createErr);
    return json({ error: createErr?.message || 'create_failed' }, 400);
  }

  // Assign admin role
  const { error: roleErr } = await supabase
    .from('user_roles')
    .insert({ user_id: created.user.id, role: 'admin' });
  if (roleErr) {
    console.error('role insert error', roleErr);
    return json({ error: 'role_failed' }, 500);
  }

  return json({ ok: true, user_id: created.user.id });
});
