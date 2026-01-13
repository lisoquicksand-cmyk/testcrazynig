import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OrderMessage {
  id: string;
  order_id: string | null;
  course_order_id: string | null;
  sender_type: "admin" | "customer";
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useOrderMessages = (orderId?: string, courseOrderId?: string) => {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = async () => {
    if (!orderId && !courseOrderId) return;
    
    setLoading(true);
    let query = supabase
      .from("order_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (orderId) {
      query = query.eq("order_id", orderId);
    } else if (courseOrderId) {
      query = query.eq("course_order_id", courseOrderId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages((data as OrderMessage[]) || []);
      setUnreadCount(
        (data || []).filter((m: OrderMessage) => !m.is_read && m.sender_type === "customer").length
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [orderId, courseOrderId]);

  const sendMessage = async (message: string, senderType: "admin" | "customer") => {
    const insertData: {
      message: string;
      sender_type: string;
      order_id?: string;
      course_order_id?: string;
    } = {
      message,
      sender_type: senderType,
    };

    if (orderId) {
      insertData.order_id = orderId;
    } else if (courseOrderId) {
      insertData.course_order_id = courseOrderId;
    }

    const { data, error } = await supabase
      .from("order_messages")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return false;
    }

    setMessages((prev) => [...prev, data as OrderMessage]);
    return true;
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("order_messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.error("Error deleting message:", error);
      return false;
    }

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    return true;
  };

  const markAsRead = async (messageIds: string[]) => {
    const { error } = await supabase
      .from("order_messages")
      .update({ is_read: true })
      .in("id", messageIds);

    if (error) {
      console.error("Error marking messages as read:", error);
      return false;
    }

    setMessages((prev) =>
      prev.map((m) =>
        messageIds.includes(m.id) ? { ...m, is_read: true } : m
      )
    );
    setUnreadCount(0);
    return true;
  };

  return { messages, loading, sendMessage, markAsRead, deleteMessage, unreadCount, refetch: fetchMessages };
};

// Hook to get message counts for all orders
export const useAllOrderMessageCounts = () => {
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("order_messages")
      .select("order_id, course_order_id, is_read, sender_type");

    if (error) {
      console.error("Error fetching message counts:", error);
      setLoading(false);
      return;
    }

    const counts: Record<string, number> = {};
    (data || []).forEach((msg) => {
      const key = msg.order_id || msg.course_order_id;
      if (key) {
        if (!counts[key]) counts[key] = 0;
        // Count unread customer messages for admin view
        if (!msg.is_read && msg.sender_type === "customer") {
          counts[key]++;
        }
      }
    });

    setMessageCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return { messageCounts, loading, refetch: fetchCounts };
};
