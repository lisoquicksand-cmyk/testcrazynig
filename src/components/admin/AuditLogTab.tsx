import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuditRow {
  id: string;
  event_type: string;
  details: string | null;
  page_path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  user_id: string | null;
  created_at: string;
}

const labels: Record<string, string> = {
  blocked_shortcut: "🚫 קיצור חסום",
  blocked_devtools_key: "🛠️ ניסיון פתיחת כלי מפתחים",
  blocked_context_menu: "🖱️ קליק ימני חסום",
  admin_page_access: "🔑 גישה לעמוד ניהול",
  bootstrap_admin_error: "❌ שגיאת יצירת אדמין",
  bootstrap_admin_success: "✅ אדמין נוצר",
};

const AuditLogTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("security_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast({ title: "שגיאה בטעינת היומן", description: error.message, variant: "destructive" });
    setRows((data as AuditRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const clearAll = async () => {
    const { error } = await supabase.from("security_audit_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast({ title: "שגיאה במחיקה", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "היומן נוקה" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-primary">🕵️ יומן אבטחה (ניסיונות גישה וקיצורים)</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw size={16} className="ml-2" />רענן
          </Button>
          <Button variant="destructive" size="sm" onClick={clearAll}>
            <Trash2 size={16} className="ml-2" />נקה הכל
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">אין רשומות עדיין</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="minecraft-card p-3 text-sm space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{labels[r.event_type] || r.event_type}</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(r.created_at).toLocaleString("he-IL")}
                </span>
              </div>
              {r.details && <div className="text-muted-foreground">פרטים: {r.details}</div>}
              <div className="text-xs text-muted-foreground break-all">
                IP: {r.ip_address || "לא ידוע"} · דף: {r.page_path || "-"} · משתמש: {r.user_id || "אורח"}
              </div>
              {r.user_agent && (
                <div className="text-xs text-muted-foreground break-all opacity-70">{r.user_agent}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogTab;
