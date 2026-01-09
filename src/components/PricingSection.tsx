import { useState } from "react";
import { usePricing, PricingPackage } from "@/hooks/usePricing";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useDiscount } from "@/hooks/useDiscount";
import { Check, Star, Tag } from "lucide-react";
import CheckoutDialog from "./CheckoutDialog";

const PricingSection = () => {
  const { packages, loading } = usePricing();
  const { content } = useSiteContent();
  const { discount, calculateDiscountedPrice } = useDiscount();
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const activePackages = packages.filter((p) => p.is_active);

  const handleSelectPackage = (pkg: PricingPackage) => {
    setSelectedPackage(pkg);
    setCheckoutOpen(true);
  };

  if (loading) {
    return (
      <section id="payment" className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">טוען מחירים...</p>
        </div>
      </section>
    );
  }

  if (activePackages.length === 0) {
    return null;
  }

  const hasActiveDiscount = discount.isActive && discount.percentage > 0;

  return (
    <section id="payment" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 
          className="section-title mb-4"
          style={{ fontFamily: `'${content.fontFamily}', sans-serif` }}
        >
          {content.pricingTitle}
        </h2>
        <p className="text-center text-muted-foreground mb-6">
          בחרו את החבילה המתאימה לכם
        </p>

        {hasActiveDiscount && (
          <div className="flex justify-center mb-8">
            <div className="bg-primary/10 border border-primary/30 rounded-full px-6 py-3 flex items-center gap-3 animate-pulse">
              <Tag className="text-primary" size={24} />
              <span className="text-lg font-bold text-primary">
                🎉 מבצע! {discount.percentage}% הנחה על כל החבילות!
              </span>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePackages.map((pkg) => {
            const discountedPrice = calculateDiscountedPrice(pkg.price);
            const showDiscount = hasActiveDiscount && discountedPrice < pkg.price;
            
            return (
              <div
                key={pkg.id}
                className={`minecraft-card relative transition-all duration-300 hover:scale-105 ${
                  pkg.is_popular
                    ? "border-2 border-primary ring-2 ring-primary/20"
                    : ""
                }`}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Star size={14} /> הכי פופולרי
                    </span>
                  </div>
                )}

                {showDiscount && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{discount.percentage}%
                    </span>
                  </div>
                )}

                <div className="text-center mb-6 pt-4">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {pkg.name}
                  </h3>
                  {pkg.description && (
                    <p className="text-muted-foreground text-sm">{pkg.description}</p>
                  )}
                </div>

                <div className="text-center mb-6">
                  {showDiscount ? (
                    <div className="space-y-1">
                      <span className="text-xl text-muted-foreground line-through">
                        ₪{pkg.price}
                      </span>
                      <div>
                        <span className="text-4xl font-extrabold text-primary">
                          ₪{Math.round(discountedPrice)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-4xl font-extrabold text-primary">
                      ₪{pkg.price}
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handleSelectPackage({
                    ...pkg,
                    price: showDiscount ? Math.round(discountedPrice) : pkg.price
                  })}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
                >
                  בחר חבילה
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedPackage={selectedPackage}
      />
    </section>
  );
};

export default PricingSection;
