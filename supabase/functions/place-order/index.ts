// Server-side order placement.
// Receives only package/course IDs + optional promo code from the client,
// looks up canonical price + discount in the database, and inserts the row.
// This prevents clients from manipulating the price before submission.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // DDoS / abuse protection: per-IP and per-email rate limits.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { data: ipOk } = await supabase.rpc('check_rate_limit', {
      _bucket: `place-order:ip:${ip}`,
      _max_hits: 20,
      _window_seconds: 300,
    });
    if (ipOk === false) return json({ error: 'rate_limited' }, 429);

    const body = await req.json().catch(() => ({}));
    const type = body.type;
    const id = body.id;
    const discord = typeof body.discord_name === 'string' ? body.discord_name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const rawPromo = typeof body.promo_code === 'string' ? body.promo_code.trim().toUpperCase() : '';

    // Validation
    if (type !== 'package' && type !== 'course') {
      return json({ error: 'invalid_type' }, 400);
    }
    if (typeof id !== 'string' || id.length < 8) {
      return json({ error: 'invalid_id' }, 400);
    }
    if (discord.length < 2 || discord.length > 50) {
      return json({ error: 'invalid_discord' }, 400);
    }
    if (!EMAIL_RE.test(email) || email.length > 255) {
      return json({ error: 'invalid_email' }, 400);
    }

    const { data: emailOk } = await supabase.rpc('check_rate_limit', {
      _bucket: `place-order:email:${email.toLowerCase()}`,
      _max_hits: 5,
      _window_seconds: 600,
    });
    if (emailOk === false) return json({ error: 'rate_limited' }, 429);


    // Lookup canonical price
    let basePrice = 0;
    let itemName = '';
    if (type === 'package') {
      const { data, error } = await supabase
        .from('pricing_packages')
        .select('id, name, price, is_active')
        .eq('id', id)
        .maybeSingle();
      if (error || !data || !data.is_active) {
        return json({ error: 'package_not_found' }, 404);
      }
      basePrice = Number(data.price);
      itemName = data.name;
    } else {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, price, is_active')
        .eq('id', id)
        .maybeSingle();
      if (error || !data || !data.is_active) {
        return json({ error: 'course_not_found' }, 404);
      }
      basePrice = Number(data.price);
      itemName = data.title;
    }

    // Validate promo code server-side
    let discountPct = 0;
    let promoRowId: string | null = null;
    if (rawPromo) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', rawPromo)
        .eq('is_active', true)
        .maybeSingle();
      const appliesType = type === 'package' ? 'packages' : 'courses';
      if (promo) {
        const now = new Date();
        const okType = promo.applies_to === 'all' || promo.applies_to === appliesType;
        const okLimit = promo.usage_limit === null || promo.times_used < promo.usage_limit;
        const okFrom = !promo.valid_from || new Date(promo.valid_from) <= now;
        const okUntil = !promo.valid_until || new Date(promo.valid_until) >= now;
        if (okType && okLimit && okFrom && okUntil) {
          discountPct = Number(promo.discount_percentage) || 0;
          promoRowId = promo.id;
        }
      }
    }

    const finalPrice = discountPct > 0
      ? Math.round(basePrice * (1 - discountPct / 100))
      : basePrice;

    // Insert order
    let orderId: string | null = null;
    if (type === 'package') {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          package_id: id,
          package_name: itemName,
          price: finalPrice,
          discord_name: discord,
          email,
          status: 'pending',
        })
        .select('id')
        .single();
      if (error) {
        console.error('insert order error', error);
        return json({ error: 'insert_failed' }, 500);
      }
      orderId = data.id;
    } else {
      const { data, error } = await supabase
        .from('course_orders')
        .insert({
          course_id: id,
          course_name: itemName,
          price: finalPrice,
          discord_name: discord,
          email,
          status: 'pending',
        })
        .select('id')
        .single();
      if (error) {
        console.error('insert course_order error', error);
        return json({ error: 'insert_failed' }, 500);
      }
      orderId = data.id;
    }

    // Increment promo usage
    if (promoRowId) {
      const { data: cur } = await supabase
        .from('promo_codes')
        .select('times_used')
        .eq('id', promoRowId)
        .maybeSingle();
      if (cur) {
        await supabase
          .from('promo_codes')
          .update({ times_used: (cur.times_used || 0) + 1 })
          .eq('id', promoRowId);
      }
    }

    return json({
      ok: true,
      order_id: orderId,
      final_price: finalPrice,
      discount_percentage: discountPct,
    }, 200);
  } catch (e) {
    console.error('place-order exception', e);
    return json({ error: 'server_error' }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
