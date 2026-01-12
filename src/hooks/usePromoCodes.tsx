import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  applies_to: "all" | "packages" | "courses";
  usage_limit: number | null;
  times_used: number;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export const usePromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error) {
        setPromoCodes(data as PromoCode[]);
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const validatePromoCode = async (
    code: string,
    type: "packages" | "courses"
  ): Promise<{ valid: boolean; discount: number; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        return { valid: false, discount: 0, error: "קוד קופון לא תקין" };
      }

      const promoCode = data as PromoCode;

      // Check if applies to this type
      if (promoCode.applies_to !== "all" && promoCode.applies_to !== type) {
        return { valid: false, discount: 0, error: "קוד זה לא תקף לסוג זה" };
      }

      // Check usage limit
      if (promoCode.usage_limit !== null && promoCode.times_used >= promoCode.usage_limit) {
        return { valid: false, discount: 0, error: "קוד זה מוגבל והגיע למקסימום שימושים" };
      }

      // Check validity dates
      const now = new Date();
      if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
        return { valid: false, discount: 0, error: "קוד זה עדיין לא בתוקף" };
      }
      if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
        return { valid: false, discount: 0, error: "קוד זה פג תוקף" };
      }

      return { valid: true, discount: promoCode.discount_percentage };
    } catch (error) {
      console.error("Error validating promo code:", error);
      return { valid: false, discount: 0, error: "שגיאה בבדיקת הקוד" };
    }
  };

  const usePromoCode = async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("id, times_used")
        .eq("code", code.toUpperCase().trim())
        .maybeSingle();

      if (error || !data) return false;

      await supabase
        .from("promo_codes")
        .update({ times_used: data.times_used + 1 })
        .eq("id", data.id);

      return true;
    } catch (error) {
      console.error("Error using promo code:", error);
      return false;
    }
  };

  const createPromoCode = async (
    promoCode: Omit<PromoCode, "id" | "created_at" | "updated_at" | "times_used">
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.from("promo_codes").insert({
        code: promoCode.code.toUpperCase().trim(),
        discount_percentage: promoCode.discount_percentage,
        is_active: promoCode.is_active,
        applies_to: promoCode.applies_to,
        usage_limit: promoCode.usage_limit,
        valid_from: promoCode.valid_from,
        valid_until: promoCode.valid_until,
      });

      if (!error) {
        await fetchPromoCodes();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating promo code:", error);
      return false;
    }
  };

  const updatePromoCode = async (
    id: string,
    updates: Partial<Omit<PromoCode, "id" | "created_at" | "updated_at">>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update(updates)
        .eq("id", id);

      if (!error) {
        await fetchPromoCodes();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating promo code:", error);
      return false;
    }
  };

  const deletePromoCode = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);

      if (!error) {
        await fetchPromoCodes();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting promo code:", error);
      return false;
    }
  };

  return {
    promoCodes,
    loading,
    validatePromoCode,
    usePromoCode,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    refetch: fetchPromoCodes,
  };
};
