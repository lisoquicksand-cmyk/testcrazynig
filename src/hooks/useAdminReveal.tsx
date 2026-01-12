import { useState, useEffect } from "react";

const ADMIN_COMMAND = "crazy://admin-panel";

export const useAdminReveal = () => {
  const [isAdminVisible, setIsAdminVisible] = useState(false);

  useEffect(() => {
    // Create the function that can be called from console
    const revealAdmin = () => {
      setIsAdminVisible(true);
      console.log(
        "%c✅ Admin Panel Revealed!",
        "color: #22c55e; font-size: 16px; font-weight: bold;"
      );
      return "Admin panel button is now visible!";
    };

    const hideAdmin = () => {
      setIsAdminVisible(false);
      console.log(
        "%c🔒 Admin Panel Hidden!",
        "color: #ef4444; font-size: 16px; font-weight: bold;"
      );
      return "Admin panel button is now hidden!";
    };

    // Expose functions globally for console access
    (window as any).crazyAdmin = {
      show: revealAdmin,
      hide: hideAdmin,
    };

    // Also allow typing the command directly
    console.log(
      "%c🎮 CrazyPlay Edits Console",
      "color: #a855f7; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);"
    );
    console.log(
      "%cType: %ccrazyAdmin.show()%c or evaluate: %ccrazy://admin-panel",
      "color: #888;",
      "color: #22c55e; font-weight: bold;",
      "color: #888;",
      "color: #22c55e; font-weight: bold;"
    );

    // Override console to detect the command being typed
    const originalEval = (window as any).eval;
    (window as any).eval = function(code: string) {
      if (code && code.toString().trim() === ADMIN_COMMAND) {
        revealAdmin();
        return "Admin panel revealed!";
      }
      return originalEval.call(window, code);
    };

    return () => {
      delete (window as any).crazyAdmin;
      (window as any).eval = originalEval;
    };
  }, []);

  return { isAdminVisible, setIsAdminVisible };
};
