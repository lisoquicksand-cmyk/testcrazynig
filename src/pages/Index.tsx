import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import HeroSection from "@/components/HeroSection";
import WelcomeSection from "@/components/WelcomeSection";
import WhyChooseSection from "@/components/WhyChooseSection";
import VideoSection from "@/components/VideoSection";
import ContactSection from "@/components/ContactSection";
import RulesSection from "@/components/RulesSection";
import CourseSection from "@/components/CourseSection";
import PricingSection from "@/components/PricingSection";
import CustomCursor from "@/components/CustomCursor";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Index = () => {
  const { background } = useSiteSettings();

  const getBackgroundStyle = (): React.CSSProperties => {
    if (background.type === "solid") {
      return { backgroundColor: background.color || "#0a0a0a" };
    }
    if (background.type === "gradient") {
      return {
        background: `linear-gradient(180deg, ${background.gradientFrom || "#1a0a2e"} 0%, ${background.gradientTo || "#0a0a0a"} 100%)`,
      };
    }
    if (background.type === "animated" && background.customImage) {
      return {
        backgroundImage: `url(${background.customImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      };
    }
    return {};
  };

  // Intersection Observer for section animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const sections = document.querySelectorAll(".section-animate");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  // Determine if we use the animated class (stars) when no custom image is set
  const useAnimatedClass = background.type === "animated" && !background.customImage;

  return (
    <div 
      className={`min-h-screen ${useAnimatedClass ? "cosmic-bg" : ""}`}
      style={getBackgroundStyle()}
    >
      <CustomCursor />
      <Sidebar />
      
      {/* Main content with sidebar offset */}
      <main className="md:mr-64">
        <HeroSection />
        <div className="section-animate">
          <WelcomeSection />
        </div>
        <div className="section-animate">
          <VideoSection />
        </div>
        <div className="section-animate">
          <ContactSection />
        </div>
        <div className="section-animate">
          <RulesSection />
        </div>
        <div className="section-animate">
          <WhyChooseSection />
        </div>
        <div className="section-animate">
          <CourseSection />
        </div>
        <div className="section-animate">
          <PricingSection />
        </div>
        
        {/* Footer */}
        <footer className="py-8 px-4 text-center border-t border-border/30">
          <p className="text-muted-foreground text-sm">
            © 2024 CrazyPlay Edits. כל הזכויות שמורות.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
