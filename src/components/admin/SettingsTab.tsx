import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAdminPassword } from "@/hooks/useAdminPassword";
import { useDiscount } from "@/hooks/useDiscount";
import { Save, Lock, Eye, EyeOff, Percent, Tag } from "lucide-react";

const SettingsTab = () => {
  const { toast } = useToast();
  const { changePassword } = useAdminPassword();
  const { discount, updateDiscount, loading: discountLoading } = useDiscount();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Discount state
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountActive, setDiscountActive] = useState(false);
  const [savingDiscount, setSavingDiscount] = useState(false);

  useEffect(() => {
    if (!discountLoading) {
      setDiscountPercentage(discount.percentage);
      setDiscountActive(discount.isActive);
    }
  }, [discount, discountLoading]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "נא למלא את כל השדות", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "הסיסמאות אינן תואמות", variant: "destructive" });
      return;
    }

    if (newPassword.length < 4) {
      toast({ title: "הסיסמה חייבת להכיל לפחות 4 תווים", variant: "destructive" });
      return;
    }

    setSaving(true);
    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      toast({ title: "הסיסמה שונתה בהצלחה!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast({ title: result.error || "שגיאה בשינוי הסיסמה", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSaveDiscount = async () => {
    setSavingDiscount(true);
    const success = await updateDiscount({
      percentage: discountPercentage,
      isActive: discountActive,
    });
    
    if (success) {
      toast({ title: "הגדרות ההנחה נשמרו בהצלחה!" });
    } else {
      toast({ title: "שגיאה בשמירת ההנחה", variant: "destructive" });
    }
    setSavingDiscount(false);
  };

  return (
    <div className="space-y-6">
      {/* Discount Section */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Tag className="text-primary" size={24} />
          🏷️ הגדרות הנחה
        </h2>
        <div className="space-y-6 max-w-md">
          <div className="flex items-center justify-between">
            <Label htmlFor="discountActive" className="text-lg">הפעל הנחה</Label>
            <Switch
              id="discountActive"
              checked={discountActive}
              onCheckedChange={setDiscountActive}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg">אחוז הנחה</Label>
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                <Percent size={20} className="text-primary" />
                <span className="text-2xl font-bold text-primary">{discountPercentage}%</span>
              </div>
            </div>
            
            <Slider
              value={[discountPercentage]}
              onValueChange={(value) => setDiscountPercentage(value[0])}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={discountPercentage}
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                setDiscountPercentage(val);
              }}
              className="bg-background/50 w-24"
            />
            <span className="flex items-center text-muted-foreground">אחוז הנחה (0-100)</span>
          </div>

          {discountActive && discountPercentage > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-center">
                🎉 הנחה של <span className="font-bold text-primary">{discountPercentage}%</span> פעילה על כל החבילות!
              </p>
            </div>
          )}

          <Button 
            onClick={handleSaveDiscount} 
            disabled={savingDiscount}
            className="w-full"
          >
            <Save className="ml-2" size={18} />
            {savingDiscount ? "שומר..." : "שמור הגדרות הנחה"}
          </Button>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4">🔐 שינוי סיסמה</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="currentPassword">סיסמה נוכחית</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="הזן סיסמה נוכחית..."
                className="bg-background/50 pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="newPassword">סיסמה חדשה</Label>
            <Input
              id="newPassword"
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="הזן סיסמה חדשה..."
              className="bg-background/50"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">אימות סיסמה חדשה</Label>
            <Input
              id="confirmPassword"
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="הזן שוב את הסיסמה החדשה..."
              className="bg-background/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPasswords(!showPasswords)}
            >
              {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="mr-2">{showPasswords ? "הסתר" : "הצג"} סיסמאות</span>
            </Button>
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={saving}
            className="w-full"
          >
            <Lock className="ml-2" size={18} />
            {saving ? "משנה..." : "שנה סיסמה"}
          </Button>
        </div>
      </div>

      <div className="minecraft-card bg-muted/20">
        <p className="text-sm text-muted-foreground text-center">
          ⚠️ לאחר שינוי הסיסמה, תצטרך להשתמש בסיסמה החדשה בכניסה הבאה
        </p>
      </div>
    </div>
  );
};

export default SettingsTab;
