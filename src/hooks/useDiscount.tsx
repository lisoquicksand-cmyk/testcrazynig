import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DiscountSettings {
  percentage: number;
  isActive: boolean;
  endDate: string | null; // ISO date string
}

export interface AllDiscounts {
  packages: DiscountSettings;
  courses: DiscountSettings;
}

const defaultDiscount: DiscountSettings = { percentage: 0, isActive: false, endDate: null };

const isDiscountExpired = (endDate: string | null): boolean => {
  if (!endDate) return false;
  return new Date(endDate).getTime() < new Date().getTime();
};

export const useDiscount = () => {
  const [discounts, setDiscounts] = useState<AllDiscounts>({
    packages: defaultDiscount,
    courses: defaultDiscount,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("setting_key", ["discount_packages", "discount_courses"]);

      if (data && !error) {
        const newDiscounts: AllDiscounts = { packages: defaultDiscount, courses: defaultDiscount };
        data.forEach((item) => {
          if (item.setting_key === "discount_packages") {
            newDiscounts.packages = item.setting_value as unknown as DiscountSettings;
          } else if (item.setting_key === "discount_courses") {
            newDiscounts.courses = item.setting_value as unknown as DiscountSettings;
          }
        });
        setDiscounts(newDiscounts);
      }
    } catch (error) {
      console.error("Error fetching discounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateDiscount = async (type: "packages" | "courses", newSettings: DiscountSettings) => {
    try {
      const settingKey = type === "packages" ? "discount_packages" : "discount_courses";
      const jsonValue = JSON.parse(JSON.stringify(newSettings));
      
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", settingKey)
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from("site_settings")
          .update({ 
            setting_value: jsonValue, 
            updated_at: new Date().toISOString() 
          })
          .eq("setting_key", settingKey);
        error = result.error;
      } else {
        const result = await supabase
          .from("site_settings")
          .insert({ 
            setting_key: settingKey,
            setting_value: jsonValue 
          });
        error = result.error;
      }

      if (!error) {
        setDiscounts(prev => ({ ...prev, [type]: newSettings }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating discount:", error);
      return false;
    }
  };

  const isPackageDiscountActive = useCallback((): boolean => {
    if (!discounts.packages.isActive || discounts.packages.percentage <= 0) {
      return false;
    }
    if (isDiscountExpired(discounts.packages.endDate)) {
      return false;
    }
    return true;
  }, [discounts.packages]);

  const isCourseDiscountActive = useCallback((): boolean => {
    if (!discounts.courses.isActive || discounts.courses.percentage <= 0) {
      return false;
    }
    if (isDiscountExpired(discounts.courses.endDate)) {
      return false;
    }
    return true;
  }, [discounts.courses]);

  const calculatePackageDiscount = (originalPrice: number): number => {
    if (!isPackageDiscountActive()) {
      return originalPrice;
    }
    return originalPrice * (1 - discounts.packages.percentage / 100);
  };

  const calculateCourseDiscount = (originalPrice: number): number => {
    if (!isCourseDiscountActive()) {
      return originalPrice;
    }
    return originalPrice * (1 - discounts.courses.percentage / 100);
  };

  return { 
    discounts, 
    loading, 
    updateDiscount, 
    calculatePackageDiscount,
    calculateCourseDiscount,
    isPackageDiscountActive,
    isCourseDiscountActive,
    refetch: fetchDiscounts 
  };
};
