import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePromoCodes } from "@/hooks/usePromoCodes";
import { Tag, Check, X, Loader2 } from "lucide-react";

interface PromoCodeInputProps {
  type: "packages" | "courses";
  onApply: (discount: number, code: string) => void;
  onRemove: () => void;
  appliedCode: string | null;
  appliedDiscount: number;
}

const PromoCodeInput = ({ type, onApply, onRemove, appliedCode, appliedDiscount }: PromoCodeInputProps) => {
  const { validatePromoCode } = usePromoCodes();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    setError(null);
    
    const result = await validatePromoCode(code, type);
    
    if (result.valid) {
      onApply(result.discount, code.toUpperCase().trim());
      setCode("");
    } else {
      setError(result.error || "קוד לא תקין");
    }
    
    setLoading(false);
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="text-green-500" size={18} />
          <span className="text-green-500 font-medium">
            קוד <span className="font-mono font-bold">{appliedCode}</span> הופעל - {appliedDiscount}% הנחה
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <X size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="הזן קוד קופון"
            className="pr-10 font-mono bg-background/50"
            maxLength={50}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={loading || !code.trim()}
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : "החל"}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <X size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

export default PromoCodeInput;
