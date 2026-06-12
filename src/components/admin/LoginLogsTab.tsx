import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginAttempt {
  id: string;
  success: boolean;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  identifier: string | null;
  created_at: string;
}

const LoginLogsTab = () => {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAttempts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_login_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setAttempts((data as LoginAttempt[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const successCount = attempts.filter((a) => a.success).length;
  const failCount = attempts.length - successCount;

  return (
    <div className="space-y-4">
      <div className="minecraft-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-primary" size={24} />
            🛡️ יומן כניסות לפאנל הניהול
          </h2>
          <Button variant="outline" size="sm" onClick={fetchAttempts} disabled={loading}>
            <RefreshCw className={`ml-2 ${loading ? "animate-spin" : ""}`} size={16} />
            רענן
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <div className="text-2xl font-bold">{attempts.length}</div>
            <div className="text-xs text-muted-foreground">סה"כ ניסיונות</div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <div className="text-2xl font-bold text-green-500">{successCount}</div>
            <div className="text-xs text-muted-foreground">הצלחות</div>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <div className="text-2xl font-bold text-red-500">{failCount}</div>
            <div className="text-xs text-muted-foreground">כישלונות</div>
          </div>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {attempts.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">אין רישומים עדיין</p>
          )}
          {attempts.map((a) => (
            <div
              key={a.id}
              className={`p-3 rounded-lg border ${
                a.success
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {a.success ? (
                    <Check className="text-green-500" size={18} />
                  ) : (
                    <X className="text-red-500" size={18} />
                  )}
                  <span className="font-semibold">
                    {a.success ? "כניסה מוצלחת" : "ניסיון כושל"}
                  </span>
                  {a.reason && (
                    <span className="text-xs text-muted-foreground">({a.reason})</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("he-IL")}
                </span>
              </div>
              {a.user_agent && (
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {a.user_agent}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginLogsTab;
