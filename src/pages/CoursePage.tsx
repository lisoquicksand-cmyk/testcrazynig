import { useEffect, useState, useRef } from "react";
import CustomCursor from "@/components/CustomCursor";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Course, CourseSyllabus } from "@/hooks/useCourses";
import { useDiscount } from "@/hooks/useDiscount";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePromoCodes } from "@/hooks/usePromoCodes";
import PromoCodeInput from "@/components/PromoCodeInput";
import CountdownTimer from "@/components/CountdownTimer";
import {
  GraduationCap, ArrowRight, Play, User, BookOpen,
  Mail, MessageCircle, CheckCircle, Send, Tag
} from "lucide-react";

const CoursePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { content } = useSiteContent();
  const { background } = useSiteSettings();
  const { discounts, isCourseDiscountActive, calculateCourseDiscount } = useDiscount();
  const { usePromoCode } = usePromoCodes();
  const registrationRef = useRef<HTMLDivElement>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [discordName, setDiscordName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();

      if (data && !error) {
        setCourse(data as unknown as Course);
      }
      setLoading(false);
    };
    fetchCourse();
  }, [id]);

  const hasActiveDiscount = isCourseDiscountActive();
  const discount = discounts.courses;
  const originalPrice = course?.price ?? 0;
  const discountedPrice = calculateCourseDiscount(originalPrice);
  const showSaleDiscount = hasActiveDiscount && discountedPrice < originalPrice;
  const priceAfterSale = showSaleDiscount ? Math.round(discountedPrice) : originalPrice;
  const finalPrice = promoDiscount > 0
    ? Math.round(priceAfterSale * (1 - promoDiscount / 100))
    : priceAfterSale;

  const scrollToRegistration = () => {
    registrationRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDiscord = discordName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedDiscord || trimmedDiscord.length < 2) {
      toast({ title: "נא להזין שם Discord תקין", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      toast({ title: "נא להזין כתובת אימייל תקינה", variant: "destructive" });
      return;
    }
    if (!course) return;

    setIsSubmitting(true);
    const { error } = await supabase.from("course_orders").insert({
      course_id: course.id,
      course_name: course.title,
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
      toast({ title: "שגיאה בשליחת ההזמנה", variant: "destructive" });
    } else {
      localStorage.setItem("customerEmail", trimmedEmail);
      setIsSuccess(true);
      toast({ title: "ההזמנה נשלחה בהצלחה!" });
    }
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    if (background.type === "solid") return { backgroundColor: background.color || "#0a0a0a" };
    if (background.type === "gradient") return {
      background: `linear-gradient(180deg, ${background.gradientFrom || "#1a0a2e"} 0%, ${background.gradientTo || "#0a0a0a"} 100%)`,
    };
    if (background.type === "animated" && background.customImage) return {
      backgroundImage: `url(${background.customImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    };
    return {};
  };

  const useAnimatedClass = background.type === "animated" && !background.customImage;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isFormValid = discordName.trim().length >= 2 && emailRegex.test(email.trim());

  const syllabus: CourseSyllabus[] = Array.isArray(course?.syllabus) ? course.syllabus : [];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${useAnimatedClass ? "cosmic-bg" : ""}`} style={getBackgroundStyle()}>
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${useAnimatedClass ? "cosmic-bg" : ""}`} style={getBackgroundStyle()}>
        <p className="text-muted-foreground text-xl">הקורס לא נמצא</p>
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowRight className="ml-2" size={18} />
          חזרה לדף הבית
        </Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${useAnimatedClass ? "cosmic-bg" : ""}`} style={getBackgroundStyle()}>
      <CustomCursor />
      {/* Back button */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button onClick={() => navigate("/")} variant="ghost" size="sm">
            <ArrowRight className="ml-2" size={18} />
            חזרה
          </Button>
          <Button onClick={scrollToRegistration} size="sm">
            הרשמה לקורס
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section - Video + Info */}
        <div className="grid lg:grid-cols-2 gap-8 items-start mb-12">
          {/* Video */}
          <div className="order-2 lg:order-1">
            {course.video_url ? (
              <div className="rounded-2xl overflow-hidden border border-border/30 shadow-xl aspect-video">
                <iframe
                  src={course.video_url.replace("watch?v=", "embed/")}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={course.title}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-border/30 bg-card aspect-video flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Play size={48} className="mx-auto mb-2 opacity-50" />
                  <p>סרטון תצוגה מקדימה</p>
                </div>
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="order-1 lg:order-2 text-right space-y-6">
            <div className="flex items-center gap-3 justify-end">
              <h1
                className="text-3xl lg:text-4xl font-extrabold text-foreground"
                style={{ fontFamily: `'${content.fontFamily}', sans-serif` }}
              >
                {course.title}
              </h1>
              <div className="p-3 rounded-xl bg-primary/20 text-primary shrink-0">
                <GraduationCap className="w-10 h-10" />
              </div>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {course.full_description || course.description || ""}
            </p>

            <hr className="border-border/30" />

            {/* Instructor */}
            {course.instructor_name && (
              <div className="flex items-center gap-4 justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">מרצה:</p>
                  <p className="font-bold text-foreground">{course.instructor_name}</p>
                </div>
                {course.instructor_image ? (
                  <img
                    src={course.instructor_image}
                    alt={course.instructor_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <User size={24} className="text-muted-foreground" />
                  </div>
                )}
              </div>
            )}

            {/* Price + CTA */}
            <div className="flex items-center gap-4 justify-end flex-wrap">
              <Button onClick={scrollToRegistration} size="lg" className="text-lg px-8 py-6 font-bold">
                {course.button_text}
              </Button>
              <div className="text-left">
                {showSaleDiscount ? (
                  <div>
                    <span className="text-lg text-muted-foreground line-through">₪{originalPrice}</span>
                    <div className="text-3xl font-extrabold text-primary">₪{Math.round(discountedPrice)}</div>
                  </div>
                ) : (
                  <div className="text-3xl font-extrabold text-primary">₪{originalPrice}</div>
                )}
              </div>
            </div>

            {hasActiveDiscount && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">🎉 מבצע! {discount.percentage}% הנחה!</span>
                  <Tag className="text-primary" size={20} />
                </div>
                {discount.endDate && <CountdownTimer endDate={discount.endDate} />}
              </div>
            )}
          </div>
        </div>

        {/* Syllabus / Table of Contents */}
        {syllabus.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 justify-end mb-6">
              <h2 className="text-2xl font-bold text-foreground">תוכן עניינים</h2>
              <BookOpen className="text-primary" size={28} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {syllabus.map((section, idx) => (
                <div key={idx} className="minecraft-card">
                  <h3 className="font-bold text-foreground text-lg mb-3 text-right">
                    {section.title}
                  </h3>
                  <ul className="space-y-2 text-right">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-muted-foreground flex items-center gap-2 justify-end">
                        <span>{item}</span>
                        <span className="text-primary">•</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div ref={registrationRef} id="registration" className="max-w-md mx-auto mb-16">
          <div className="minecraft-card">
            <div className="text-center mb-6">
              <GraduationCap className="w-12 h-12 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-foreground">
                {isSuccess ? "ההזמנה נשלחה!" : "הרשמה לקורס"}
              </h2>
              {!isSuccess && (
                <p className="text-muted-foreground mt-1">
                  {course.title} - {promoDiscount > 0 ? (
                    <>
                      <span className="line-through">₪{priceAfterSale}</span>{" "}
                      <span className="text-primary font-bold">₪{finalPrice}</span>
                    </>
                  ) : showSaleDiscount ? (
                    <>
                      <span className="line-through">₪{originalPrice}</span>{" "}
                      <span className="text-primary font-bold">₪{priceAfterSale}</span>
                    </>
                  ) : (
                    <span className="text-primary font-bold">₪{originalPrice}</span>
                  )}
                </p>
              )}
            </div>

            {isSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-lg">תודה על ההרשמה!</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    ההזמנה נשלחה בהצלחה. נציג יצור איתך קשר דרך Discord בהקדם האפשרי.
                  </p>
                </div>
                <Button onClick={() => navigate("/")} className="w-full">
                  חזרה לדף הבית
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
                    onApply={(d, c) => { setAppliedPromoCode(c); setPromoDiscount(d); }}
                    onRemove={() => { setAppliedPromoCode(null); setPromoDiscount(0); }}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
