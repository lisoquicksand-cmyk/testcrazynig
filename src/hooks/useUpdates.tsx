import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Update {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useUpdates = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from("updates")
        .select("*")
        .order("display_order", { ascending: true });

      if (data && !error) {
        setUpdates(data as unknown as Update[]);
      }
    } catch (error) {
      console.error("Error fetching updates:", error);
    } finally {
      setLoading(false);
    }
  };

  const addUpdate = async (update: { title: string; content: string }) => {
    try {
      const { data, error } = await supabase
        .from("updates")
        .insert([update as any])
        .select()
        .single();

      if (data && !error) {
        setUpdates((prev) => [...prev, data as unknown as Update]);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding update:", error);
      return false;
    }
  };

  const updateUpdate = async (id: string, changes: Partial<Update>) => {
    try {
      const { error } = await supabase
        .from("updates")
        .update({ ...changes, updated_at: new Date().toISOString() } as any)
        .eq("id", id);

      if (!error) {
        setUpdates((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ...changes } : u))
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating update:", error);
      return false;
    }
  };

  const deleteUpdate = async (id: string) => {
    try {
      const { error } = await supabase.from("updates").delete().eq("id", id);
      if (!error) {
        setUpdates((prev) => prev.filter((u) => u.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting update:", error);
      return false;
    }
  };

  return { updates, loading, addUpdate, updateUpdate, deleteUpdate, refetch: fetchUpdates };
};
