import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bell, X, Send, MessageCircle, ChevronDown, ChevronUp, Volume2, VolumeX, Music } from "lucide-react";
import { playNotificationSound, SoundType, soundNames } from "@/lib/notificationSound";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  order_id: string | null;
  course_order_id: string | null;
  sender_type: "admin" | "customer";
  message: string;
  is_read: boolean;
  created_at: string;
}

interface OrderInfo {
  id: string;
  type: "package" | "course";
  name: string;
}

const CustomerMessageBanner = () => {
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState<SoundType>("chime");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load customer email and sound preference from localStorage
  useEffect(() => {
    const email = localStorage.getItem("customerEmail");
    if (email) {
      setCustomerEmail(email);
    }
    const soundPref = localStorage.getItem("notificationSound");
    if (soundPref !== null) {
      setSoundEnabled(soundPref === "true");
    }
    const soundType = localStorage.getItem("notificationSoundType") as SoundType;
    if (soundType) {
      setSelectedSound(soundType);
    }
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem("notificationSound", String(newValue));
    if (newValue) {
      // Play a test sound when enabling
      playNotificationSound(selectedSound);
    }
  };

  const handleSoundChange = (sound: SoundType) => {
    setSelectedSound(sound);
    localStorage.setItem("notificationSoundType", sound);
    playNotificationSound(sound);
  };

  // Fetch orders and check for unread messages
  useEffect(() => {
    if (!customerEmail) return;

    const fetchOrdersAndMessages = async () => {
      // Fetch orders for this email
      const [ordersRes, courseOrdersRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, package_name")
          .eq("email", customerEmail),
        supabase
          .from("course_orders")
          .select("id, course_name")
          .eq("email", customerEmail),
      ]);

      const foundOrders: OrderInfo[] = [];
      const orderIds: string[] = [];
      const courseOrderIds: string[] = [];

      if (ordersRes.data) {
        ordersRes.data.forEach((o) => {
          foundOrders.push({ id: o.id, type: "package", name: o.package_name });
          orderIds.push(o.id);
        });
      }

      if (courseOrdersRes.data) {
        courseOrdersRes.data.forEach((o) => {
          foundOrders.push({ id: o.id, type: "course", name: o.course_name });
          courseOrderIds.push(o.id);
        });
      }

      setOrders(foundOrders);

      // Fetch unread admin messages for these orders
      if (orderIds.length > 0 || courseOrderIds.length > 0) {
        let query = supabase
          .from("order_messages")
          .select("*")
          .eq("sender_type", "admin")
          .eq("is_read", false);

        if (orderIds.length > 0 && courseOrderIds.length > 0) {
          query = query.or(`order_id.in.(${orderIds.join(",")}),course_order_id.in.(${courseOrderIds.join(",")})`);
        } else if (orderIds.length > 0) {
          query = query.in("order_id", orderIds);
        } else {
          query = query.in("course_order_id", courseOrderIds);
        }

        const { data } = await query;
        setUnreadMessages((data as Message[]) || []);
      }
    };

    fetchOrdersAndMessages();

    // Set up realtime subscription for new messages
    const channel = supabase
      .channel("customer-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_messages",
          filter: "sender_type=eq.admin",
        },
        (payload) => {
          // Check if this message is for one of our orders
          const newMsg = payload.new as Message;
          const isOurOrder = orders.some(
            (o) =>
              (o.type === "package" && o.id === newMsg.order_id) ||
              (o.type === "course" && o.id === newMsg.course_order_id)
          );
          if (isOurOrder) {
            setUnreadMessages((prev) => [...prev, newMsg]);
            setDismissed(false);
            // Play notification sound if enabled
            const soundPref = localStorage.getItem("notificationSound");
            if (soundPref !== "false") {
              playNotificationSound();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerEmail, orders.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectOrder = async (order: OrderInfo) => {
    setSelectedOrder(order);

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
    const unreadAdminMsgs = ((data as Message[]) || [])
      .filter((m) => !m.is_read && m.sender_type === "admin")
      .map((m) => m.id);

    if (unreadAdminMsgs.length > 0) {
      await supabase
        .from("order_messages")
        .update({ is_read: true })
        .in("id", unreadAdminMsgs);

      setUnreadMessages((prev) =>
        prev.filter((m) => !unreadAdminMsgs.includes(m.id))
      );
    }
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

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("order_messages")
      .delete()
      .eq("id", messageId);

    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("he-IL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Don't show if no email or no unread messages
  if (!customerEmail || (unreadMessages.length === 0 && !expanded) || dismissed) {
    return null;
  }

  const getOrderForMessage = (msg: Message) => {
    return orders.find(
      (o) =>
        (o.type === "package" && o.id === msg.order_id) ||
        (o.type === "course" && o.id === msg.course_order_id)
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 md:right-64">
      {/* Banner */}
      <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={20} />
              {unreadMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadMessages.length}
                </span>
              )}
            </div>
            <span className="font-medium">
              יש לך {unreadMessages.length} הודעות חדשות מנציג CrazyEdits!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setExpanded(!expanded)}
              className="gap-1"
            >
              {expanded ? (
                <>
                  סגור <ChevronUp size={16} />
                </>
              ) : (
                <>
                  צפה בהודעות <ChevronDown size={16} />
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/20 gap-1"
                  title="בחר צליל התראה"
                >
                  <Music size={16} />
                  <span className="text-xs hidden sm:inline">{soundNames[selectedSound]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                {(Object.keys(soundNames) as SoundType[]).map((sound) => (
                  <DropdownMenuItem
                    key={sound}
                    onClick={() => handleSoundChange(sound)}
                    className={selectedSound === sound ? "bg-primary/20" : ""}
                  >
                    {soundNames[sound]}
                    {selectedSound === sound && " ✓"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleSound}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              title={soundEnabled ? "כבה צליל התראות" : "הדלק צליל התראות"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Messages Panel */}
      {expanded && (
        <div className="bg-card border-b border-border shadow-xl max-h-[60vh] overflow-hidden">
          <div className="max-w-4xl mx-auto p-4">
            {!selectedOrder ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">בחר הזמנה לצפייה בהודעות:</p>
                {orders.map((order) => {
                  const orderUnreadCount = unreadMessages.filter(
                    (m) =>
                      (order.type === "package" && m.order_id === order.id) ||
                      (order.type === "course" && m.course_order_id === order.id)
                  ).length;

                  return (
                    <Button
                      key={order.id}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleSelectOrder(order)}
                    >
                      <span className="flex items-center gap-2">
                        <MessageCircle size={16} />
                        {order.type === "package" ? "📦" : "🎓"} {order.name}
                      </span>
                      {orderUnreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {orderUnreadCount} חדשות
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ← חזרה
                  </Button>
                  <span className="text-sm font-medium">
                    {selectedOrder.type === "package" ? "📦" : "🎓"} {selectedOrder.name}
                  </span>
                </div>

                {/* Messages */}
                <div className="h-[200px] overflow-y-auto space-y-2 p-3 bg-muted/30 rounded-lg">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">אין הודעות עדיין</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_type === "customer" ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-2 rounded-lg relative group ${
                            msg.sender_type === "customer"
                              ? "bg-green-500/20"
                              : "bg-primary/20"
                          }`}
                        >
                          <p className="text-xs font-bold mb-1">
                            {msg.sender_type === "admin" ? "נציג CrazyEdits" : "אתה"}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatTime(msg.created_at)}
                            </p>
                            {msg.sender_type === "customer" && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-xs transition-opacity"
                              >
                                מחק
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Message */}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMessageBanner;
