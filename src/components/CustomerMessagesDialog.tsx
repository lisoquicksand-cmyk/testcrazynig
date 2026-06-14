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
    const { data, error } = await supabase.functions.invoke("customer-portal", {
      body: { action: "list_orders", email: email.trim() },
    });
    if (error || !data || data.error) {
      setSearching(false);
      return;
    }
    const found: OrderInfo[] = [
      ...(data.orders || []),
      ...(data.course_orders || []),
    ];
    setOrders(found);
    setSearching(false);
  };

  const handleSelectOrder = async (order: OrderInfo) => {
    setSelectedOrder(order);
    setLoadingMessages(true);
    const { data } = await supabase.functions.invoke("customer-portal", {
      body: {
        action: "list_messages",
        email: order.email,
        order_id: order.id,
        order_type: order.type,
      },
    });
    const msgs: Message[] = data?.messages || [];
    setMessages(msgs);
    const unreadIds = msgs.filter((m) => !m.is_read && m.sender_type === "admin").map((m) => m.id);
    if (unreadIds.length) {
      supabase.functions.invoke("customer-portal", {
        body: { action: "mark_read", email: order.email, ids: unreadIds },
      });
    }
    setLoadingMessages(false);
    setStep("messages");
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedOrder) return;
    setSending(true);
    const { data } = await supabase.functions.invoke("customer-portal", {
      body: {
        action: "send_message",
        email: selectedOrder.email,
        order_id: selectedOrder.id,
        order_type: selectedOrder.type,
        message: newMessage.trim(),
      },
    });
    if (data?.message) {
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    }
    setSending(false);
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleString("he-IL", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });

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
              : `הודעות עבור: ${selectedOrder?.name}`}
          </DialogDescription>
        </DialogHeader>

        {step === "search" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="הזן אימייל..."
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              />
              <Button onClick={handleSearch} disabled={searching || !email.trim()}>
                <Search size={16} />
              </Button>
            </div>

            {searching && <p className="text-center text-muted-foreground py-4">מחפש...</p>}
            {!searching && orders.length === 0 && email && (
              <p className="text-center text-muted-foreground py-4">לא נמצאו הזמנות עם האימייל הזה</p>
            )}
            {orders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">בחר הזמנה:</p>
                {orders.map((order) => (
                  <Button
                    key={`${order.type}-${order.id}`}
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
            <Button variant="ghost" size="sm" className="self-start mb-2" onClick={() => setStep("search")}>
              ← חזרה לבחירת הזמנה
            </Button>

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
                  <div key={msg.id} className={`flex ${msg.sender_type === "customer" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender_type === "customer" ? "bg-green-500/20 text-foreground" : "bg-primary/20 text-foreground"}`}>
                      <p className="text-xs font-bold mb-1">
                        {msg.sender_type === "admin" ? "נציג CrazyEdits" : "אתה"}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

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
              <Button onClick={handleSend} disabled={!newMessage.trim() || sending} className="self-end">
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
