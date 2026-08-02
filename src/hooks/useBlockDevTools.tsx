import { useEffect } from "react";
import { logAuditEvent } from "@/lib/auditLog";


/**
 * Blocks common developer-tools / inspection shortcuts and the context menu.
 * NOTE: this is a deterrent only — it cannot truly prevent a determined user
 * from opening devtools (browser menus can't be intercepted by a web page).
 */
export const useBlockDevTools = () => {
  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const node = el as HTMLElement | null;
      if (!node || !node.tagName) return false;
      const tag = node.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || node.isContentEditable;
    };

    const block = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const combo = (e: KeyboardEvent) =>
      [e.ctrlKey && "Ctrl", e.metaKey && "Cmd", e.altKey && "Alt", e.shiftKey && "Shift", e.key]
        .filter(Boolean)
        .join("+");

    const onKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || "").toLowerCase();

      // F12 and all other function keys
      if (/^f\d{1,2}$/.test(key)) {
        logAuditEvent(key === "f12" ? "blocked_devtools_key" : "blocked_shortcut", combo(e));
        return block(e);
      }

      // Ctrl/Cmd + Shift + any letter (I, J, C, K, E, M, P ...)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        logAuditEvent("blocked_devtools_key", combo(e));
        return block(e);
      }

      if (e.ctrlKey || e.metaKey) {
        // View source / save / print / find / open / select-all / copy-cut-paste
        const blocked = ["u", "s", "p", "f", "g", "o", "h", "j", "i", "k", "e", "m"];
        if (blocked.includes(key)) {
          logAuditEvent("blocked_shortcut", combo(e));
          return block(e);
        }
        if (["a", "c", "x", "v"].includes(key) && !isEditable(e.target)) {
          logAuditEvent("blocked_shortcut", combo(e));
          return block(e);
        }
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      logAuditEvent("blocked_context_menu");
      return block(e);
    };

    const onSelectStart = (e: Event) => {
      if (!isEditable(e.target)) block(e);
    };
    const onDragStart = (e: Event) => block(e);

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("selectstart", onSelectStart, true);
    document.addEventListener("dragstart", onDragStart, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("selectstart", onSelectStart, true);
      document.removeEventListener("dragstart", onDragStart, true);
    };
  }, []);
};
