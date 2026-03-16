import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Testimonial {
  id: string;
  author_name: string;
  content: string;
  logo_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTestimonials = async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) {
      setTestimonials(data as Testimonial[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const addTestimonial = async (testimonial: Omit<Testimonial, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase.from("testimonials").insert(testimonial);
    if (!error) {
      await fetchTestimonials();
      return true;
    }
    return false;
  };

  const updateTestimonial = async (id: string, updates: Partial<Testimonial>) => {
    const { error } = await supabase.from("testimonials").update(updates).eq("id", id);
    if (!error) {
      await fetchTestimonials();
      return true;
    }
    return false;
  };

  const deleteTestimonial = async (id: string) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (!error) {
      await fetchTestimonials();
      return true;
    }
    return false;
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `testimonial-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("site-images").upload(fileName, file);
    if (error) return null;
    const { data } = supabase.storage.from("site-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  return {
    testimonials,
    loading,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
    uploadLogo,
  };
};
