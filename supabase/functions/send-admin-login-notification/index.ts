// Sends an email notification to the admin's Gmail when a login event occurs.
// Uses the Lovable Gmail connector (gateway-backed).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const ADMIN_EMAIL = 'mistercrazyplay@gmail.com';
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1';

function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildRawMessage(to: string, subject: string, htmlBody: string): string {
  const headers = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
  ].join('\r\n');
  return encodeBase64Url(headers);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAIL_API_KEY = Deno.env.get('GOOGLE_MAIL_API_KEY');

    if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gmail connector is not configured. Please connect Gmail in Lovable.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const eventType: string = body.eventType || 'admin_login_success';
    const userAgent: string = body.userAgent || 'unknown';
    const occurredAt = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });

    const eventLabels: Record<string, string> = {
      admin_login_success: '✅ כניסה מוצלחת לפאנל הניהול',
      admin_login_failure: '❌ ניסיון כניסה כושל',
      admin_login_locked: '🔒 חשבון ננעל - יותר מדי ניסיונות',
    };
    const eventTitle = eventLabels[eventType] || eventType;

    const subject = `[התראת אבטחה] ${eventTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #ffffff;">
        <h2 style="color: #1e40af; margin: 0 0 16px;">${eventTitle}</h2>
        <p style="color: #111827; font-size: 14px; line-height: 1.6;">
          זוהה אירוע באזור הניהול של האתר.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">סוג האירוע</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600;">${eventType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">תיאור</td>
            <td style="padding: 8px 0; color: #111827;">${eventTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">תאריך ושעה</td>
            <td style="padding: 8px 0; color: #111827;">${occurredAt}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">דפדפן / מכשיר</td>
            <td style="padding: 8px 0; color: #111827; word-break: break-all;">${userAgent}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
          אם זה לא היית אתה - מומלץ לשנות את הסיסמה מיידית.
        </p>
      </div>
    `;

    const raw = buildRawMessage(ADMIN_EMAIL, subject, html);

    const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAIL_API_KEY,
      },
      body: JSON.stringify({ raw }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('Gmail send failed', res.status, text);
      return new Response(
        JSON.stringify({ error: 'Gmail send failed', status: res.status, details: text }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ ok: true, response: JSON.parse(text) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
