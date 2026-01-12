import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Home, User, Video, Film, MessageCircle, CreditCard, Settings, ScrollText, GraduationCap } from "lucide-react";
import heroLogoDefault from "@/assets/hero-logo.png";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useAdminReveal } from "@/hooks/useAdminReveal";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  { label: "בית", icon: <Home size={18} />, href: "#home" },
  { label: "מידע עלי", icon: <User size={18} />, href: "#about" },
  { label: "דוגמאות סרטונים", icon: <Video size={18} />, href: "#videos" },
  { label: "דוגמאות שורטס", icon: <Film size={18} />, href: "#shorts" },
  { label: "תקשורת", icon: <MessageCircle size={18} />, href: "#contact" },
  { label: "חוקים", icon: <ScrollText size={18} />, href: "#rules" },
  { label: "קורסים", icon: <GraduationCap size={18} />, href: "#courses" },
  { label: "תשלום", icon: <CreditCard size={18} />, href: "#payment" },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { content } = useSiteContent();
  const { isAdminVisible } = useAdminReveal();
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("בית");
  const [isScrolling, setIsScrolling] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    e.preventDefault();
    setIsOpen(false);
    setIsScrolling(true);
    
    // Set active item immediately when clicked
    setActiveItem(item.label);

    const targetId = item.href.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    // Allow scroll detection again after smooth scroll completes
    setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  useEffect(() => {
    const handleScroll = () => {
      // Skip if we're in the middle of a programmatic scroll
      if (isScrolling) return;

      // Probe line inside the viewport. Using a fixed 200px offset caused the active
      // section to "jump" when a section is short (e.g. Videos -> Shorts).
      const probeY = window.innerHeight * 0.35;

      // Get all sections that actually exist in the DOM, sorted by their position on the page
      const existingSections = navItems
        .map((item) => ({
          label: item.label,
          element: document.getElementById(item.href.replace("#", "")),
        }))
        .filter(
          (section): section is { label: string; element: HTMLElement } =>
            section.element !== null
        )
        .sort((a, b) => a.element.offsetTop - b.element.offsetTop);

      // If no sections exist or at the very top, default to home
      if (existingSections.length === 0 || window.scrollY < 80) {
        setActiveItem("בית");
        return;
      }

      // Prefer the section that contains the probe line
      for (const section of existingSections) {
        const rect = section.element.getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom >= probeY) {
          setActiveItem(section.label);
          return;
        }
      }

      // Otherwise, pick the last section above the probe line
      let bestLabel = existingSections[0].label;
      let bestTop = -Infinity;
      for (const section of existingSections) {
        const top = section.element.getBoundingClientRect().top;
        if (top <= probeY && top > bestTop) {
          bestTop = top;
          bestLabel = section.label;
        }
      }

      setActiveItem(bestLabel);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolling]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-sidebar/80 backdrop-blur-sm border border-sidebar-border md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-sidebar/95 backdrop-blur-md border-l border-sidebar-border z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 mt-2">
            <img
              src={content.heroLogo || heroLogoDefault}
              alt="CrazyPlay Edits Logo"
              className="w-10 h-10 rounded-lg object-cover animate-pulse"
            />
            <span className="text-xl font-bold text-sidebar-foreground">
              CrazyEdits
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {navItems.map((item, index) => (
                <li 
                  key={item.label}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      activeItem === item.label
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/30 scale-105"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-[-4px]"
                    }`}
                  >
                    <span className={`transition-transform duration-300 ${activeItem === item.label ? "scale-110" : ""}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Admin Button - Hidden by default, revealed via console command */}
          {isAdminVisible && (
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/admin");
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all duration-300 hover:scale-105 border border-accent/30 mt-4 animate-fade-in"
            >
              <Settings size={18} className="animate-spin" style={{ animationDuration: "3s" }} />
              <span className="font-medium">פאנל ניהול</span>
            </button>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
