import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePromoCodes, PromoCode } from "@/hooks/usePromoCodes";
import { Plus, Trash2, Tag, Percent, Calendar, Users } from "lucide-react";
import { z } from "zod";

const promoCodeSchema = z.object({
  code: z.string().trim().min(1, "קוד חובה").max(50, "קוד ארוך מדי"),
  discount_percentage: z.number().min(1, "אחוז חייב להיות לפחות 1").max(100, "אחוז מקסימלי 100"),
});

const PromoCodesTab = () => {
  const { toast } = useToast();
  const { promoCodes, loading, createPromoCode, updatePromoCode, deletePromoCode } = usePromoCodes();
  
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState(10);
  const [newAppliesTo, setNewAppliesTo] = useState<"all" | "packages" | "courses">("all");
  const [newUsageLimit, setNewUsageLimit] = useState<string>("");
  const [newValidUntil, setNewValidUntil] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const validation = promoCodeSchema.safeParse({
      code: newCode,
      discount_percentage: newDiscount,
    });

    if (!validation.success) {
      toast({ title: validation.error.errors[0].message, variant: "destructive" });
      return;
    }

    setSaving(true);
    const success = await createPromoCode({
      code: newCode.toUpperCase().trim(),
      discount_percentage: newDiscount,
      is_active: newIsActive,
      applies_to: newAppliesTo,
      usage_limit: newUsageLimit ? parseInt(newUsageLimit) : null,
      valid_from: new Date().toISOString(),
      valid_until: newValidUntil || null,
    });

    if (success) {
      toast({ title: "קוד קופון נוצר בהצלחה!" });
      setNewCode("");
      setNewDiscount(10);
      setNewAppliesTo("all");
      setNewUsageLimit("");
      setNewValidUntil("");
    } else {
      toast({ title: "שגיאה ביצירת קוד קופון", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleToggleActive = async (promo: PromoCode) => {
    const success = await updatePromoCode(promo.id, { is_active: !promo.is_active });
    if (success) {
      toast({ title: promo.is_active ? "קוד קופון בוטל" : "קוד קופון הופעל" });
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deletePromoCode(id);
    if (success) {
      toast({ title: "קוד קופון נמחק" });
    } else {
      toast({ title: "שגיאה במחיקת קוד קופון", variant: "destructive" });
    }
  };

  const getAppliesToLabel = (appliesTo: string) => {
    switch (appliesTo) {
      case "all": return "הכל";
      case "packages": return "חבילות";
      case "courses": return "קורסים";
      default: return appliesTo;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">טוען קודי קופון...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create New Promo Code */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Tag className="text-primary" size={24} />
          ➕ יצירת קוד קופון חדש
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>קוד קופון</Label>
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="לדוגמה: SUMMER20"
              className="bg-background/50 font-mono"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Percent size={16} />
              אחוז הנחה
            </Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={newDiscount}
              onChange={(e) => setNewDiscount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>תקף ל</Label>
            <Select value={newAppliesTo} onValueChange={(v) => setNewAppliesTo(v as "all" | "packages" | "courses")}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="packages">חבילות בלבד</SelectItem>
                <SelectItem value="courses">קורסים בלבד</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users size={16} />
              הגבלת שימושים (ריק = ללא הגבלה)
            </Label>
            <Input
              type="number"
              min={1}
              value={newUsageLimit}
              onChange={(e) => setNewUsageLimit(e.target.value)}
              placeholder="ללא הגבלה"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar size={16} />
              תאריך תפוגה (ריק = ללא הגבלה)
            </Label>
            <Input
              type="datetime-local"
              value={newValidUntil}
              onChange={(e) => setNewValidUntil(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <Switch
              checked={newIsActive}
              onCheckedChange={setNewIsActive}
            />
            <Label>פעיל מיידית</Label>
          </div>
        </div>

        <Button
          onClick={handleCreate}
          disabled={saving || !newCode.trim()}
          className="w-full mt-4"
        >
          <Plus className="ml-2" size={18} />
          {saving ? "יוצר..." : "צור קוד קופון"}
        </Button>
      </div>

      {/* Existing Promo Codes */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4">📋 קודי קופון קיימים ({promoCodes.length})</h2>
        
        {promoCodes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">אין קודי קופון עדיין</p>
        ) : (
          <div className="space-y-3">
            {promoCodes.map((promo) => (
              <div
                key={promo.id}
                className={`p-4 rounded-lg border transition-all ${
                  promo.is_active 
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-muted/30 border-muted opacity-60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-lg bg-primary/10 px-3 py-1 rounded">
                      {promo.code}
                    </span>
                    <span className="text-primary font-bold">
                      {promo.discount_percentage}% הנחה
                    </span>
                    <span className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      {getAppliesToLabel(promo.applies_to)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {promo.times_used} שימושים
                      {promo.usage_limit && ` / ${promo.usage_limit}`}
                    </span>
                    <Switch
                      checked={promo.is_active}
                      onCheckedChange={() => handleToggleActive(promo)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(promo.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
                
                {promo.valid_until && (
                  <p className="text-xs text-muted-foreground mt-2">
                    תפוגה: {new Date(promo.valid_until).toLocaleString('he-IL')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoCodesTab;
