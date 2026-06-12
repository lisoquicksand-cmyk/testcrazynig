import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "admin_login_attempts_v1";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

type LocalState = {
  failures: number[]; // timestamps
  lockedUntil: number | null;
};

const readState = (): LocalState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { failures: [], lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { failures: [], lockedUntil: null };
  }
};

const writeState = (s: LocalState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

export const getLockoutInfo = () => {
  const s = readState();
  const now = Date.now();
  if (s.lockedUntil && s.lockedUntil > now) {
    return { locked: true, remainingMs: s.lockedUntil - now, attemptsLeft: 0 };
  }
  // expire old failures
  const recent = s.failures.filter((t) => now - t < WINDOW_MS);
  return {
    locked: false,
    remainingMs: 0,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - recent.length),
  };
};

export const logLoginAttempt = async (success: boolean, reason?: string) => {
  try {
    await supabase.from("admin_login_attempts").insert({
      success,
      reason: reason ?? null,
      user_agent: navigator.userAgent,
      identifier: "admin-panel",
    });
  } catch (e) {
    console.error("Failed to log login attempt", e);
  }
};

export const recordFailure = () => {
  const now = Date.now();
  const s = readState();
  const recent = s.failures.filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  let lockedUntil = s.lockedUntil;
  if (recent.length >= MAX_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_MS;
  }
  writeState({ failures: recent, lockedUntil });
};

export const recordSuccess = () => {
  writeState({ failures: [], lockedUntil: null });
};
