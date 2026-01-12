import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAdminPassword } from "@/hooks/useAdminPassword";
import { useDiscount } from "@/hooks/useDiscount";
import { Save, Lock, Eye, EyeOff, Percent, Package, GraduationCap, Clock } from "lucide-react";

const SettingsTab = () => {
  const { toast } = useToast();
  const { changePassword } = useAdminPassword();
  const { discounts, updateDiscount, loading: discountLoading } = useDiscount();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Package Discount state
  const [packageDiscountPercentage, setPackageDiscountPercentage] = useState(0);
  const [packageDiscountActive, setPackageDiscountActive] = useState(false);
  const [packageDiscountEndDate, setPackageDiscountEndDate] = useState("");
  const [savingPackageDiscount, setSavingPackageDiscount] = useState(false);

  // Course Discount state
  const [courseDiscountPercentage, setCourseDiscountPercentage] = useState(0);
  const [courseDiscountActive, setCourseDiscountActive] = useState(false);
  const [courseDiscountEndDate, setCourseDiscountEndDate] = useState("");
  const [savingCourseDiscount, setSavingCourseDiscount] = useState(false);

  useEffect(() => {
    if (!discountLoading) {
      setPackageDiscountPercentage(discounts.packages.percentage);
      setPackageDiscountActive(discounts.packages.isActive);
      setPackageDiscountEndDate(discounts.packages.endDate || "");
      setCourseDiscountPercentage(discounts.courses.percentage);
      setCourseDiscountActive(discounts.courses.isActive);
      setCourseDiscountEndDate(discounts.courses.endDate || "");
    }
  }, [discounts, discountLoading]);

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

  const handleSavePackageDiscount = async () => {
    setSavingPackageDiscount(true);
    const success = await updateDiscount("packages", {
      percentage: packageDiscountPercentage,
      isActive: packageDiscountActive,
      endDate: packageDiscountEndDate || null,
    });
    
    if (success) {
      toast({ title: "הנחת חבילות נשמרה בהצלחה!" });
    } else {
      toast({ title: "שגיאה בשמירת ההנחה", variant: "destructive" });
    }
    setSavingPackageDiscount(false);
  };

  const handleSaveCourseDiscount = async () => {
    setSavingCourseDiscount(true);
    const success = await updateDiscount("courses", {
      percentage: courseDiscountPercentage,
      isActive: courseDiscountActive,
      endDate: courseDiscountEndDate || null,
    });
    
    if (success) {
      toast({ title: "הנחת קורסים נשמרה בהצלחה!" });
    } else {
      toast({ title: "שגיאה בשמירת ההנחה", variant: "destructive" });
    }
    setSavingCourseDiscount(false);
  };

  return (
    <div className="space-y-6">
      {/* Package Discount Section */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="text-primary" size={24} />
          🏷️ הנחה על חבילות
        </h2>
        <div className="space-y-6 max-w-md">
          <div className="flex items-center justify-between">
            <Label htmlFor="packageDiscountActive" className="text-lg">הפעל הנחה</Label>
            <Switch
              id="packageDiscountActive"
              checked={packageDiscountActive}
              onCheckedChange={setPackageDiscountActive}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg">אחוז הנחה</Label>
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                <Percent size={20} className="text-primary" />
                <span className="text-2xl font-bold text-primary">{packageDiscountPercentage}%</span>
              </div>
            </div>
            
            <Slider
              value={[packageDiscountPercentage]}
              onValueChange={(value) => setPackageDiscountPercentage(value[0])}
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
              value={packageDiscountPercentage}
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                setPackageDiscountPercentage(val);
              }}
              className="bg-background/50 w-24"
            />
            <span className="flex items-center text-muted-foreground">אחוז הנחה (0-100)</span>
          </div>

          <div className="space-y-2">
            <Label className="text-lg flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              תאריך ושעת סיום ההנחה
            </Label>
            <Input
              type="datetime-local"
              value={packageDiscountEndDate}
              onChange={(e) => setPackageDiscountEndDate(e.target.value)}
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              השאר ריק להנחה ללא הגבלת זמן (צריך לכבות ידנית)
            </p>
          </div>

          {packageDiscountActive && packageDiscountPercentage > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-center">
                🎉 הנחה של <span className="font-bold text-primary">{packageDiscountPercentage}%</span> פעילה על כל החבילות!
                {packageDiscountEndDate && (
                  <span className="block mt-1 text-xs">
                    תסתיים ב: {new Date(packageDiscountEndDate).toLocaleString('he-IL')}
                  </span>
                )}
              </p>
            </div>
          )}

          <Button 
            onClick={handleSavePackageDiscount} 
            disabled={savingPackageDiscount}
            className="w-full"
          >
            <Save className="ml-2" size={18} />
            {savingPackageDiscount ? "שומר..." : "שמור הנחת חבילות"}
          </Button>
        </div>
      </div>

      {/* Course Discount Section */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <GraduationCap className="text-primary" size={24} />
          🎓 הנחה על קורסים
        </h2>
        <div className="space-y-6 max-w-md">
          <div className="flex items-center justify-between">
            <Label htmlFor="courseDiscountActive" className="text-lg">הפעל הנחה</Label>
            <Switch
              id="courseDiscountActive"
              checked={courseDiscountActive}
              onCheckedChange={setCourseDiscountActive}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg">אחוז הנחה</Label>
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                <Percent size={20} className="text-primary" />
                <span className="text-2xl font-bold text-primary">{courseDiscountPercentage}%</span>
              </div>
            </div>
            
            <Slider
              value={[courseDiscountPercentage]}
              onValueChange={(value) => setCourseDiscountPercentage(value[0])}
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
              value={courseDiscountPercentage}
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                setCourseDiscountPercentage(val);
              }}
              className="bg-background/50 w-24"
            />
            <span className="flex items-center text-muted-foreground">אחוז הנחה (0-100)</span>
          </div>

          <div className="space-y-2">
            <Label className="text-lg flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              תאריך ושעת סיום ההנחה
            </Label>
            <Input
              type="datetime-local"
              value={courseDiscountEndDate}
              onChange={(e) => setCourseDiscountEndDate(e.target.value)}
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              השאר ריק להנחה ללא הגבלת זמן (צריך לכבות ידנית)
            </p>
          </div>

          {courseDiscountActive && courseDiscountPercentage > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-center">
                🎉 הנחה של <span className="font-bold text-primary">{courseDiscountPercentage}%</span> פעילה על כל הקורסים!
                {courseDiscountEndDate && (
                  <span className="block mt-1 text-xs">
                    תסתיים ב: {new Date(courseDiscountEndDate).toLocaleString('he-IL')}
                  </span>
                )}
              </p>
            </div>
          )}

          <Button 
            onClick={handleSaveCourseDiscount} 
            disabled={savingCourseDiscount}
            className="w-full"
          >
            <Save className="ml-2" size={18} />
            {savingCourseDiscount ? "שומר..." : "שמור הנחת קורסים"}
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
