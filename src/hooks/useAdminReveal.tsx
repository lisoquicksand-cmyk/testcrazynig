import { useState, useEffect } from "react";

export const useAdminReveal = () => {
  const [isAdminVisible, setIsAdminVisible] = useState(false);

  useEffect(() => {
    // Create a simple global function that can be called from console
    (window as any).crazy = function(command?: string) {
      if (command === "admin-panel" || command === undefined) {
        setIsAdminVisible(true);
        return "✅ Admin panel revealed!";
      }
      if (command === "hide") {
        setIsAdminVisible(false);
        return "🔒 Admin panel hidden!";
      }
      return "Unknown command. Use: crazy('admin-panel') or crazy('hide')";
    };

    return () => {
      delete (window as any).crazy;
    };
  }, []);

  return { isAdminVisible, setIsAdminVisible };
};
