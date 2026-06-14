// YouTube search – admin-only.
// Auth: requires a valid Supabase JWT belonging to a user that has the
// 'admin' role in public.user_roles. Plus a per-user DB-backed rate limit
// to harden against quota abuse / DDoS.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);
    const token = authHeader.slice('Bearer '.length);

    // Verify the JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: 'unauthorized' }, 401);
    const userId = claims.claims.sub as string;

    // Service role for the role check + rate limit
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!isAdmin) return json({ error: 'forbidden' }, 403);

    // DDoS / abuse rate limit: 30 calls per user per minute
    const { data: allowed } = await admin.rpc('check_rate_limit', {
      _bucket: `youtube-search:${userId}`,
      _max_hits: 30,
      _window_seconds: 60,
    });
    if (allowed === false) return json({ error: 'rate_limited' }, 429);

    const { query, maxResults = 5 } = await req.json().catch(() => ({}));
    if (!query || typeof query !== 'string' || query.length === 0 || query.length > 200) {
      return json({ error: 'Query is required' }, 400);
    }

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) return json({ error: 'YouTube API key not configured' }, 500);

    const safeMax = Math.min(Math.max(Number(maxResults) || 5, 1), 10);

    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', String(safeMax));
    searchUrl.searchParams.set('key', apiKey);

    const response = await fetch(searchUrl.toString());
    const data = await response.json();
    if (!response.ok) {
      console.error('YouTube API error:', data);
      return json({ error: data.error?.message || 'YouTube API error' }, response.status);
    }

    const videos = data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      shortsUrl: `https://www.youtube.com/shorts/${item.id.videoId}`,
    })) || [];

    return json({ videos });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in youtube-search function:', error);
    return json({ error: msg }, 500);
  }
});
