// Customer-facing read/write surface that bypasses the locked-down RLS
// for orders, course_orders, and order_messages.
// Identity = customer email (kept in localStorage on the client).
// All access is scoped: only rows whose `email` matches the given email
// are ever returned, and inserts/updates are validated against the
// canonical order row before being executed.
//
// DDoS / abuse protection: per-IP rate limit + per-email rate limit.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Global per-IP burst limit
  const { data: ipOk } = await supabase.rpc('check_rate_limit', {
    _bucket: `customer-portal:ip:${ip}`,
    _max_hits: 120,
    _window_seconds: 60,
  });
  if (ipOk === false) return json({ error: 'rate_limited' }, 429);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'invalid_body' }, 400); }

  const action = body.action;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 255) return json({ error: 'invalid_email' }, 400);

  // Per-email rate limit (write actions cost more than reads)
  const isWrite = action === 'send_message' || action === 'mark_read' || action === 'delete_message';
  const { data: emailOk } = await supabase.rpc('check_rate_limit', {
    _bucket: `customer-portal:email:${email}:${isWrite ? 'w' : 'r'}`,
    _max_hits: isWrite ? 30 : 120,
    _window_seconds: 60,
  });
  if (emailOk === false) return json({ error: 'rate_limited' }, 429);

  // ---- Helpers ----
  async function verifyOrderOwnership(orderId: string, orderType: 'package' | 'course') {
    const table = orderType === 'package' ? 'orders' : 'course_orders';
    const { data } = await supabase.from(table).select('id, email').eq('id', orderId).maybeSingle();
    if (!data) return false;
    return (data.email || '').toLowerCase() === email;
  }

  // ---- Actions ----
  if (action === 'list_orders') {
    const [{ data: o1 }, { data: o2 }] = await Promise.all([
      supabase.from('orders').select('id, package_name, discord_name, email').eq('email', email),
      supabase.from('course_orders').select('id, course_name, discord_name, email').eq('email', email),
    ]);
    return json({
      orders: (o1 || []).map((r) => ({ id: r.id, type: 'package', name: r.package_name, discord_name: r.discord_name, email: r.email })),
      course_orders: (o2 || []).map((r) => ({ id: r.id, type: 'course', name: r.course_name, discord_name: r.discord_name, email: r.email })),
    });
  }

  if (action === 'list_unread') {
    // Get unread admin messages for this customer's orders
    const [{ data: o1 }, { data: o2 }] = await Promise.all([
      supabase.from('orders').select('id').eq('email', email),
      supabase.from('course_orders').select('id').eq('email', email),
    ]);
    const orderIds = (o1 || []).map((r) => r.id);
    const courseOrderIds = (o2 || []).map((r) => r.id);
    if (orderIds.length === 0 && courseOrderIds.length === 0) return json({ messages: [] });
    let q = supabase
      .from('order_messages')
      .select('*')
      .eq('sender_type', 'admin')
      .eq('is_read', false);
    if (orderIds.length && courseOrderIds.length) {
      q = q.or(`order_id.in.(${orderIds.join(',')}),course_order_id.in.(${courseOrderIds.join(',')})`);
    } else if (orderIds.length) {
      q = q.in('order_id', orderIds);
    } else {
      q = q.in('course_order_id', courseOrderIds);
    }
    const { data } = await q;
    return json({ messages: data || [] });
  }

  if (action === 'list_messages') {
    const orderId = body.order_id;
    const orderType = body.order_type;
    if (!UUID_RE.test(orderId) || (orderType !== 'package' && orderType !== 'course')) {
      return json({ error: 'invalid_args' }, 400);
    }
    const owns = await verifyOrderOwnership(orderId, orderType);
    if (!owns) return json({ error: 'forbidden' }, 403);
    const col = orderType === 'package' ? 'order_id' : 'course_order_id';
    const { data } = await supabase
      .from('order_messages')
      .select('*')
      .eq(col, orderId)
      .order('created_at', { ascending: true });
    return json({ messages: data || [] });
  }

  if (action === 'send_message') {
    const orderId = body.order_id;
    const orderType = body.order_type;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!UUID_RE.test(orderId) || (orderType !== 'package' && orderType !== 'course')) {
      return json({ error: 'invalid_args' }, 400);
    }
    if (message.length < 1 || message.length > 2000) return json({ error: 'invalid_message' }, 400);
    const owns = await verifyOrderOwnership(orderId, orderType);
    if (!owns) return json({ error: 'forbidden' }, 403);
    const insert: Record<string, unknown> = { message, sender_type: 'customer' };
    if (orderType === 'package') insert.order_id = orderId; else insert.course_order_id = orderId;
    const { data, error } = await supabase.from('order_messages').insert(insert).select().single();
    if (error) return json({ error: 'insert_failed' }, 500);
    return json({ message: data });
  }

  if (action === 'mark_read') {
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: any) => typeof x === 'string' && UUID_RE.test(x)).slice(0, 200) : [];
    if (!ids.length) return json({ ok: true });
    // Only mark admin messages on the customer's own orders
    const [{ data: o1 }, { data: o2 }] = await Promise.all([
      supabase.from('orders').select('id').eq('email', email),
      supabase.from('course_orders').select('id').eq('email', email),
    ]);
    const orderIds = (o1 || []).map((r) => r.id);
    const courseOrderIds = (o2 || []).map((r) => r.id);
    if (orderIds.length === 0 && courseOrderIds.length === 0) return json({ ok: true });
    let q = supabase
      .from('order_messages')
      .update({ is_read: true })
      .in('id', ids)
      .eq('sender_type', 'admin');
    if (orderIds.length && courseOrderIds.length) {
      q = q.or(`order_id.in.(${orderIds.join(',')}),course_order_id.in.(${courseOrderIds.join(',')})`);
    } else if (orderIds.length) {
      q = q.in('order_id', orderIds);
    } else {
      q = q.in('course_order_id', courseOrderIds);
    }
    await q;
    return json({ ok: true });
  }

  if (action === 'delete_message') {
    const id = body.id;
    if (!UUID_RE.test(id)) return json({ error: 'invalid_args' }, 400);
    // Only delete own customer-sent messages on own orders
    const { data: msg } = await supabase
      .from('order_messages')
      .select('id, order_id, course_order_id, sender_type')
      .eq('id', id)
      .maybeSingle();
    if (!msg || msg.sender_type !== 'customer') return json({ error: 'forbidden' }, 403);
    let owns = false;
    if (msg.order_id) owns = await verifyOrderOwnership(msg.order_id, 'package');
    else if (msg.course_order_id) owns = await verifyOrderOwnership(msg.course_order_id, 'course');
    if (!owns) return json({ error: 'forbidden' }, 403);
    await supabase.from('order_messages').delete().eq('id', id);
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});
