import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageCircle, Bell, Search } from "lucide-react";

interface Message {
  id: string;
  sender_type: "admin" | "customer";
  message: string;
  is_read: boolean;
  created_at: string;
}

interface OrderInfo {
  id: string;
  type: "package" | "course";
  name: string;
  discord_name: string;
  email: string;
}

const CustomerMessagesDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [step, setStep] = useState<"search" | "messages">("search");
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setStep("search");
      setEmail("");
      setOrders([]);
      setSelectedOrder(null);
      setMessages([]);
      setNewMessage("");
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSearch = async () => {
    if (!email.trim()) return;
    
    setSearching(true);
    setOrders([]);

    // Search both orders and course_orders
    const [ordersRes, courseOrdersRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, package_name, discord_name, email")
        .eq("email", email.trim()),
      supabase
        .from("course_orders")
        .select("id, course_name, discord_name, email")
        .eq("email", email.trim()),
    ]);

    const foundOrders: OrderInfo[] = [];

    if (ordersRes.data) {
      ordersRes.data.forEach((o) => {
        foundOrders.push({
          id: o.id,
          type: "package",
          name: o.package_name,
          discord_name: o.discord_name,
          email: o.email,
        });
      });
    }

    if (courseOrdersRes.data) {
      courseOrdersRes.data.forEach((o) => {
        foundOrders.push({
          id: o.id,
          type: "course",
          name: o.course_name,
          discord_name: o.discord_name,
          email: o.email,
        });
      });
    }

    setOrders(foundOrders);
    setSearching(false);
  };

  const handleSelectOrder = async (order: OrderInfo) => {
    setSelectedOrder(order);
    setLoadingMessages(true);

    let query = supabase
      .from("order_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (order.type === "package") {
      query = query.eq("order_id", order.id);
    } else {
      query = query.eq("course_order_id", order.id);
    }

    const { data } = await query;

    setMessages((data as Message[]) || []);
    
    // Mark admin messages as read
    const unreadAdminMessages = ((data as Message[]) || [])
      .filter((m) => !m.is_read && m.sender_type === "admin")
      .map((m) => m.id);

    if (unreadAdminMessages.length > 0) {
      await supabase
        .from("order_messages")
        .update({ is_read: true })
        .in("id", unreadAdminMessages);
    }

    setLoadingMessages(false);
    setStep("messages");
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedOrder) return;
    
    setSending(true);

    const insertData: {
      message: string;
      sender_type: string;
      order_id?: string;
      course_order_id?: string;
    } = {
      message: newMessage.trim(),
      sender_type: "customer",
    };

    if (selectedOrder.type === "package") {
      insertData.order_id = selectedOrder.id;
    } else {
      insertData.course_order_id = selectedOrder.id;
    }

    const { data, error } = await supabase
      .from("order_messages")
      .insert(insertData)
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      setNewMessage("");
    }

    setSending(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("he-IL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasUnreadFromAdmin = (orderId: string, orderType: "package" | "course") => {
    return false; // This would need a separate query to check
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            הודעות מ-CrazyEdits
          </DialogTitle>
          <DialogDescription>
            {step === "search" 
              ? "הזן את האימייל שלך כדי לראות הודעות על ההזמנות שלך"
              : `הודעות עבור: ${selectedOrder?.name}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === "search" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="הזן אימייל..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <Button onClick={handleSearch} disabled={searching || !email.trim()}>
                <Search size={16} />
              </Button>
            </div>

            {searching && (
              <p className="text-center text-muted-foreground py-4">מחפש...</p>
            )}

            {!searching && orders.length === 0 && email && (
              <p className="text-center text-muted-foreground py-4">
                לא נמצאו הזמנות עם האימייל הזה
              </p>
            )}

            {orders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">בחר הזמנה:</p>
                {orders.map((order) => (
                  <Button
                    key={order.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSelectOrder(order)}
                  >
                    <MessageCircle size={16} className="ml-2" />
                    {order.type === "package" ? "📦" : "🎓"} {order.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-[400px]">
            <Button
              variant="ghost"
              size="sm"
              className="self-start mb-2"
              onClick={() => setStep("search")}
            >
              ← חזרה לבחירת הזמנה
            </Button>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-lg mb-3">
              {loadingMessages ? (
                <p className="text-center text-muted-foreground py-4">טוען הודעות...</p>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <p>אין הודעות עדיין.</p>
                  <p className="text-sm mt-1">תוכל לשלוח הודעה לנציג CrazyEdits</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_type === "customer" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.sender_type === "customer"
                          ? "bg-green-500/20 text-foreground"
                          : "bg-primary/20 text-foreground"
                      }`}
                    >
                      <p className="text-xs font-bold mb-1">
                        {msg.sender_type === "admin" ? "נציג CrazyEdits" : "אתה"}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Message Input */}
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="כתוב תגובה..."
                className="resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="self-end"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerMessagesDialog;
