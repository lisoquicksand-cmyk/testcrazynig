import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DiscountSettings {
  percentage: number;
  isActive: boolean;
}

export const useDiscount = () => {
  const [discount, setDiscount] = useState<DiscountSettings>({
    percentage: 0,
    isActive: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscount();
  }, []);

  const fetchDiscount = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("setting_key", "discount")
        .maybeSingle();

      if (data && !error && data.setting_value) {
        const value = data.setting_value as unknown as DiscountSettings;
        setDiscount(value);
      }
    } catch (error) {
      console.error("Error fetching discount:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateDiscount = async (newSettings: DiscountSettings) => {
    try {
      const jsonValue = JSON.parse(JSON.stringify(newSettings));
      
      // Check if record exists
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", "discount")
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from("site_settings")
          .update({ 
            setting_value: jsonValue, 
            updated_at: new Date().toISOString() 
          })
          .eq("setting_key", "discount");
        error = result.error;
      } else {
        const result = await supabase
          .from("site_settings")
          .insert({ 
            setting_key: "discount",
            setting_value: jsonValue 
          });
        error = result.error;
      }

      if (!error) {
        setDiscount(newSettings);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating discount:", error);
      return false;
    }
  };

  const calculateDiscountedPrice = (originalPrice: number): number => {
    if (!discount.isActive || discount.percentage <= 0) {
      return originalPrice;
    }
    return originalPrice * (1 - discount.percentage / 100);
  };

  return { 
    discount, 
    loading, 
    updateDiscount, 
    calculateDiscountedPrice,
    refetch: fetchDiscount 
  };
};
