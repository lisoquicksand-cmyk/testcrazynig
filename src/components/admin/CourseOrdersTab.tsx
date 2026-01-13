import { useState } from "react";
import { useCourseOrders, CourseOrder } from "@/hooks/useCourseOrders";
import { useAllOrderMessageCounts } from "@/hooks/useOrderMessages";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, GraduationCap, Mail, MessageCircle, Check, Clock, X, Trash2, MessageSquare } from "lucide-react";
import OrderMessagesDialog from "./OrderMessagesDialog";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  completed: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
};

const statusLabels: Record<string, string> = {
  pending: "ממתין",
  completed: "הושלם",
  cancelled: "בוטל",
};

const CourseOrdersTab = () => {
  const { orders, loading, refetch, updateOrderStatus, deleteOrder } = useCourseOrders();
  const { messageCounts, refetch: refetchCounts } = useAllOrderMessageCounts();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<CourseOrder | null>(null);
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false);

  const handleOpenMessages = (order: CourseOrder) => {
    setSelectedOrder(order);
    setMessagesDialogOpen(true);
  };

  const handleCloseMessages = (open: boolean) => {
    setMessagesDialogOpen(open);
    if (!open) {
      refetchCounts();
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const success = await updateOrderStatus(id, status);
    if (success) {
      toast({ title: "סטטוס ההזמנה עודכן!" });
    } else {
      toast({ title: "שגיאה בעדכון הסטטוס", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteOrder(id);
    if (success) {
      toast({ title: "ההזמנה נמחקה!" });
    } else {
      toast({ title: "שגיאה במחיקת ההזמנה", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="minecraft-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">🎓 הזמנות קורסים ({orders.length})</h2>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`ml-2 ${loading ? "animate-spin" : ""}`} size={16} />
            רענן
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">טוען הזמנות...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            אין הזמנות קורסים עדיין.
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={18} className="text-primary" />
                      <span className="font-bold">{order.course_name}</span>
                      <span className="text-primary font-bold">₪{order.price}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageCircle size={14} />
                      <span>Discord: {order.discord_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail size={14} />
                      <span>{order.email}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[order.status] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>

                    <div className="flex gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenMessages(order)}
                        className="text-blue-500 hover:text-blue-400 relative"
                      >
                        <MessageSquare size={14} className="ml-1" />
                        הודעות
                        {messageCounts[order.id] > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {messageCounts[order.id]}
                          </span>
                        )}
                      </Button>
                      {order.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(order.id, "completed")}
                          className="text-green-500 hover:text-green-400"
                        >
                          <Check size={14} className="ml-1" />
                          הושלם
                        </Button>
                      )}
                      {order.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(order.id, "pending")}
                          className="text-yellow-500 hover:text-yellow-400"
                        >
                          <Clock size={14} className="ml-1" />
                          ממתין
                        </Button>
                      )}
                      {order.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(order.id, "cancelled")}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X size={14} className="ml-1" />
                          בטל
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(order.id)}
                      >
                        <Trash2 size={14} className="ml-1" />
                        מחק
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <OrderMessagesDialog
        open={messagesDialogOpen}
        onOpenChange={handleCloseMessages}
        courseOrderId={selectedOrder?.id}
        customerName={selectedOrder?.discord_name || "לקוח"}
      />
    </div>
  );
};

export default CourseOrdersTab;
