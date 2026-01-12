import { useEffect, useState } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        !!target.closest("button") ||
        !!target.closest("a") ||
        target.getAttribute("role") === "button" ||
        window.getComputedStyle(target).cursor === "pointer";
      setIsHovering(isInteractive);
    };

    const handleMouseLeave = () => setIsVisible(false);

    document.addEventListener("mousemove", updatePosition);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", updatePosition);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Main cursor - Diamond shape inspired by Minecraft */}
      <div
        className="fixed pointer-events-none z-[9999] transition-transform duration-100"
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) rotate(45deg) scale(${isClicking ? 0.8 : isHovering ? 1.3 : 1})`,
        }}
      >
        {/* Outer glow */}
        <div 
          className={`absolute inset-0 rounded-sm transition-all duration-200 ${
            isHovering ? "bg-accent/40" : "bg-primary/30"
          }`}
          style={{
            width: isHovering ? "28px" : "20px",
            height: isHovering ? "28px" : "20px",
            transform: "translate(-50%, -50%)",
            filter: "blur(8px)",
          }}
        />
        
        {/* Main diamond */}
        <div 
          className={`relative transition-all duration-200 ${
            isHovering 
              ? "bg-gradient-to-br from-accent to-pink-400 border-accent-foreground" 
              : "bg-gradient-to-br from-primary to-emerald-400 border-primary-foreground"
          }`}
          style={{
            width: isHovering ? "16px" : "12px",
            height: isHovering ? "16px" : "12px",
            borderWidth: "2px",
            borderStyle: "solid",
            borderRadius: "2px",
            boxShadow: isHovering 
              ? "0 0 20px hsl(var(--accent)), inset 0 0 8px rgba(255,255,255,0.3)"
              : "0 0 15px hsl(var(--primary)), inset 0 0 6px rgba(255,255,255,0.2)",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Inner sparkle */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/60 rounded-full"
            style={{
              width: "3px",
              height: "3px",
            }}
          />
        </div>
      </div>

      {/* Trailing particles */}
      <div
        className="fixed pointer-events-none z-[9998]"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div 
          className={`absolute w-1 h-1 rounded-full transition-all duration-300 ${
            isHovering ? "bg-accent/50" : "bg-primary/40"
          }`}
          style={{
            transform: "translate(-8px, -8px)",
            opacity: isClicking ? 0.8 : 0.4,
          }}
        />
        <div 
          className={`absolute w-1 h-1 rounded-full transition-all duration-300 ${
            isHovering ? "bg-accent/40" : "bg-primary/30"
          }`}
          style={{
            transform: "translate(6px, 6px)",
            opacity: isClicking ? 0.6 : 0.3,
          }}
        />
      </div>
    </>
  );
};

export default CustomCursor;
