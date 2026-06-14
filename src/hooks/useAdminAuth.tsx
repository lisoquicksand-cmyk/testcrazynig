// Replaces the old plaintext-password admin auth.
// Real authentication via Supabase Auth + the `user_roles` table.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdminAuth = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data && !error);
    setLoading(false);
  };

  useEffect(() => {
    // Subscribe first to avoid missing events
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    refresh();
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.user) return { ok: false, error: error?.message || "שגיאת התחברות" };
    // Check admin role
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      await supabase.auth.signOut();
      return { ok: false, error: "המשתמש הזה אינו אדמין" };
    }
    return { ok: true };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUserId(null);
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (newPassword.length < 8) return { success: false, error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  return { loading, isAdmin, userId, signIn, signOut, refresh, changePassword };
};
