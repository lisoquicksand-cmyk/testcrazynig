import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOrderMessages } from "@/hooks/useOrderMessages";
import { Send, MessageCircle } from "lucide-react";

interface OrderMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
  courseOrderId?: string;
  customerName: string;
}

const OrderMessagesDialog = ({
  open,
  onOpenChange,
  orderId,
  courseOrderId,
  customerName,
}: OrderMessagesDialogProps) => {
  const { messages, loading, sendMessage, markAsRead } = useOrderMessages(
    orderId,
    courseOrderId
  );
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length > 0) {
      // Mark customer messages as read
      const unreadCustomerMessages = messages
        .filter((m) => !m.is_read && m.sender_type === "customer")
        .map((m) => m.id);
      if (unreadCustomerMessages.length > 0) {
        markAsRead(unreadCustomerMessages);
      }
    }
  }, [open, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    const success = await sendMessage(newMessage.trim(), "admin");
    if (success) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle size={20} className="text-primary" />
            הודעות ל-{customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[400px]">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-lg mb-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">טוען הודעות...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                אין הודעות עדיין. שלח הודעה ראשונה!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_type === "admin" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender_type === "admin"
                        ? "bg-primary/20 text-foreground"
                        : "bg-green-500/20 text-foreground"
                    }`}
                  >
                    <p className="text-xs font-bold mb-1">
                      {msg.sender_type === "admin" ? "נציג CrazyEdits" : customerName}
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
              placeholder="כתוב הודעה..."
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
      </DialogContent>
    </Dialog>
  );
};

export default OrderMessagesDialog;
