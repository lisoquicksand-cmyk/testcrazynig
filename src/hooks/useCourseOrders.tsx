import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CourseOrder {
  id: string;
  course_id: string | null;
  course_name: string;
  price: number;
  discord_name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useCourseOrders = () => {
  const [orders, setOrders] = useState<CourseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching course orders:", error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("course_orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating course order:", error);
      return false;
    }

    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
    return true;
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase
      .from("course_orders")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting course order:", error);
      return false;
    }

    setOrders((prev) => prev.filter((order) => order.id !== id));
    return true;
  };

  return { orders, loading, refetch: fetchOrders, updateOrderStatus, deleteOrder };
};
