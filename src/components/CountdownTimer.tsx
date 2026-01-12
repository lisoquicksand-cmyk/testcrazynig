import { useCountdown } from "@/hooks/useCountdown";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endDate: string | null;
}

const CountdownTimer = ({ endDate }: CountdownTimerProps) => {
  const countdown = useCountdown(endDate);

  if (!endDate || countdown.isExpired) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-3">
      <Clock size={18} className="text-primary animate-pulse" />
      <div className="flex items-center gap-1">
        {countdown.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="bg-primary/20 text-primary font-mono font-bold text-lg px-2 py-1 rounded-lg min-w-[40px] text-center">
              {countdown.days}
            </span>
            <span className="text-xs text-muted-foreground mt-1">ימים</span>
          </div>
        )}
        {countdown.days > 0 && <span className="text-primary font-bold text-xl mx-1">:</span>}
        <div className="flex flex-col items-center">
          <span className="bg-primary/20 text-primary font-mono font-bold text-lg px-2 py-1 rounded-lg min-w-[40px] text-center">
            {String(countdown.hours).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground mt-1">שעות</span>
        </div>
        <span className="text-primary font-bold text-xl mx-1">:</span>
        <div className="flex flex-col items-center">
          <span className="bg-primary/20 text-primary font-mono font-bold text-lg px-2 py-1 rounded-lg min-w-[40px] text-center">
            {String(countdown.minutes).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground mt-1">דקות</span>
        </div>
        <span className="text-primary font-bold text-xl mx-1">:</span>
        <div className="flex flex-col items-center">
          <span className="bg-primary/20 text-primary font-mono font-bold text-lg px-2 py-1 rounded-lg min-w-[40px] text-center animate-pulse">
            {String(countdown.seconds).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground mt-1">שניות</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
