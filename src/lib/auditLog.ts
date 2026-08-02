import { supabase } from "@/integrations/supabase/client";

let cachedIp: string | null = null;
let ipPromise: Promise<string | null> | null = null;

/** Best-effort public IP lookup (cached for the session). */
const getClientIp = async (): Promise<string | null> => {
  if (cachedIp) return cachedIp;
  if (!ipPromise) {
    ipPromise = fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => {
        cachedIp = d?.ip || null;
        return cachedIp;
      })
      .catch(() => null);
  }
  return ipPromise;
};

// Simple throttle so a user holding a blocked key doesn't spam the table
const lastLogged = new Map<string, number>();
const THROTTLE_MS = 3000;

export type AuditEventType =
  | "blocked_shortcut"
  | "blocked_context_menu"
  | "blocked_devtools_key"
  | "admin_page_access"
  | "bootstrap_admin_error"
  | "bootstrap_admin_success";

export const logAuditEvent = async (
  eventType: AuditEventType,
  details?: string,
) => {
  const throttleKey = `${eventType}:${details ?? ""}`;
  const now = Date.now();
  const prev = lastLogged.get(throttleKey);
  if (prev && now - prev < THROTTLE_MS) return;
  lastLogged.set(throttleKey, now);

  try {
    const [ip, sessionRes] = await Promise.all([
      getClientIp(),
      supabase.auth.getSession(),
    ]);

    await supabase.from("security_audit_log").insert({
      event_type: eventType,
      details: details ?? null,
      page_path: window.location.pathname,
      ip_address: ip,
      user_agent: navigator.userAgent,
      user_id: sessionRes.data.session?.user?.id ?? null,
    });
  } catch (err) {
    console.error("audit log failed", err);
  }
};
