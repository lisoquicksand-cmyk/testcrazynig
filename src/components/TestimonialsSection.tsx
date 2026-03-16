import { useTestimonials } from "@/hooks/useTestimonials";
import { Quote } from "lucide-react";

const TestimonialsSection = () => {
  const { testimonials, loading } = useTestimonials();

  const activeTestimonials = testimonials.filter((t) => t.is_active);

  if (loading || activeTestimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="section-title">💬 המלצות</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeTestimonials.map((t) => (
            <div
              key={t.id}
              className="minecraft-card flex flex-col items-center text-center gap-4"
            >
              {t.logo_url && (
                <img
                  src={t.logo_url}
                  alt={t.author_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/40"
                />
              )}
              <Quote className="text-primary/50" size={24} />
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t.content}
              </p>
              <p className="font-bold text-primary text-sm mt-auto">
                — {t.author_name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
