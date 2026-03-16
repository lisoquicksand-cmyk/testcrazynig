import { useTestimonials } from "@/hooks/useTestimonials";
import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const TestimonialsSection = () => {
  const { testimonials, loading } = useTestimonials();

  const activeTestimonials = testimonials.filter((t) => t.is_active);

  if (loading || activeTestimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="section-title">💬 המלצות</h2>
        <Carousel opts={{ direction: "rtl", loop: true }} className="w-full">
          <CarouselContent>
            {activeTestimonials.map((t) => (
              <CarouselItem key={t.id}>
                <div className="flex flex-col items-center text-center gap-4 py-8 px-4">
                  {t.logo_url && (
                    <img
                      src={t.logo_url}
                      alt={t.author_name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-primary/40"
                    />
                  )}
                  <Quote className="text-primary/50" size={32} />
                  <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
                    {t.content}
                  </p>
                  <p className="font-bold text-primary text-sm mt-2">
                    — {t.author_name}
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="border-primary/30 text-primary hover:bg-primary/10" />
          <CarouselNext className="border-primary/30 text-primary hover:bg-primary/10" />
        </Carousel>
      </div>
    </section>
  );
};

export default TestimonialsSection;
