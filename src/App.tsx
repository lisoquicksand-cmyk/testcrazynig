import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import heroLogoDefault from "@/assets/hero-logo.png";
import { useSiteContent } from "@/hooks/useSiteContent";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import CoursePage from "./pages/CoursePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { content } = useSiteContent();

  // Keep the browser tab icon in sync with the saved logo
  useEffect(() => {
    const href = content.heroLogo || heroLogoDefault;
    const existing = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;

    const link = existing ?? (() => {
      const l = document.createElement("link");
      l.rel = "icon";
      document.head.appendChild(l);
      return l;
    })();

    link.href = href;
  }, [content.heroLogo]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/course/:id" element={<CoursePage />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
