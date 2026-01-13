import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/hooks/useCourses";
import { usePromoCodes } from "@/hooks/usePromoCodes";
import { GraduationCap, Mail, MessageCircle, CheckCircle, Send } from "lucide-react";
import PromoCodeInput from "./PromoCodeInput";

interface CourseCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCourse: Course | null;
}

const CourseCheckoutDialog = ({ open, onOpenChange, selectedCourse }: CourseCheckoutDialogProps) => {
  const { toast } = useToast();
  const { usePromoCode } = usePromoCodes();
  const [discordName, setDiscordName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Promo code state
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  const originalPrice = selectedCourse?.price ?? 0;
  const finalPrice = promoDiscount > 0 
    ? Math.round(originalPrice * (1 - promoDiscount / 100)) 
    : originalPrice;

  const handleApplyPromo = (discount: number, code: string) => {
    setAppliedPromoCode(code);
    setPromoDiscount(discount);
  };

  const handleRemovePromo = () => {
    setAppliedPromoCode(null);
    setPromoDiscount(0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedDiscord = discordName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedDiscord || trimmedDiscord.length < 2 || trimmedDiscord.length > 50) {
      toast({ title: "נא להזין שם Discord תקין (2-50 תווים)", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      toast({ title: "נא להזין כתובת אימייל תקינה", variant: "destructive" });
      return;
    }

    if (!selectedCourse) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("course_orders").insert({
      course_id: selectedCourse.id,
      course_name: selectedCourse.title,
      price: finalPrice,
      discord_name: trimmedDiscord,
      email: trimmedEmail,
      status: "pending",
    });

    if (!error && appliedPromoCode) {
      await usePromoCode(appliedPromoCode);
    }

    setIsSubmitting(false);

    if (error) {
      console.error("Course order error:", error);
      toast({ title: "שגיאה בשליחת ההזמנה", variant: "destructive" });
    } else {
      // Save email to localStorage for message notifications
      localStorage.setItem("customerEmail", trimmedEmail);
      setIsSuccess(true);
      toast({ title: "ההזמנה נשלחה בהצלחה!" });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setDiscordName("");
      setEmail("");
      setIsSuccess(false);
      setAppliedPromoCode(null);
      setPromoDiscount(0);
    }, 300);
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isFormValid = discordName.trim().length >= 2 && emailRegex.test(email.trim());

  if (!selectedCourse) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <GraduationCap className="text-primary" size={24} />
            {isSuccess ? "ההזמנה נשלחה!" : "הרשמה לקורס"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "נציג יצור איתך קשר בקרוב דרך Discord"
              : (
                <span>
                  {selectedCourse.title} - 
                  {promoDiscount > 0 ? (
                    <>
                      <span className="line-through text-muted-foreground mx-1">₪{originalPrice}</span>
                      <span className="text-primary font-bold">₪{finalPrice}</span>
                    </>
                  ) : (
                    <span> ₪{originalPrice}</span>
                  )}
                </span>
              )}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <p className="font-bold text-lg">תודה על ההרשמה!</p>
              <p className="text-muted-foreground text-sm mt-2">
                ההזמנה נשלחה בהצלחה. נציג יצור איתך קשר דרך Discord בהקדם האפשרי.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              סגור
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discord" className="flex items-center gap-2">
                <MessageCircle size={16} className="text-primary" />
                שם Discord
              </Label>
              <Input
                id="discord"
                value={discordName}
                onChange={(e) => setDiscordName(e.target.value)}
                placeholder="username#0000 או username"
                className="bg-background/50"
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                אימייל
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-background/50"
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">קוד קופון</Label>
              <PromoCodeInput
                type="courses"
                onApply={handleApplyPromo}
                onRemove={handleRemovePromo}
                appliedCode={appliedPromoCode}
                appliedDiscount={promoDiscount}
              />
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
              <p>לאחר שליחת ההזמנה, נציג יצור איתך קשר לתיאום התשלום וההרשמה לקורס.</p>
            </div>

            <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? "שולח..." : `שלח הזמנה - ₪${finalPrice}`}
              <Send className="mr-2" size={18} />
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CourseCheckoutDialog;
