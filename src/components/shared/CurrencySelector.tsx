"use client";

import { useCurrency, CURRENCIES } from "@/context/CurrencyContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

interface CurrencySelectorProps {
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "default";
}

export default function CurrencySelector({
  showLabel = false,
  className = "",
  size = "default",
}: CurrencySelectorProps) {
  const { currency, siteCurrency, setUserCurrency, loading } = useCurrency();

  const handleChange = (value: string) => {
    // If user selects the same as site default, clear their preference
    if (value === siteCurrency) {
      setUserCurrency("");
    } else {
      setUserCurrency(value);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-muted-foreground">Currency:</span>
      )}
      <Select value={currency} onValueChange={handleChange}>
        <SelectTrigger
          className={`${size === "sm" ? "h-8 w-[100px] text-xs" : "w-[140px]"}`}
        >
          <Globe className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} mr-1`} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={4}
          className="max-h-[300px]"
        >
          {CURRENCIES.map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              <span className="flex items-center gap-2">
                <span>{curr.symbol}</span>
                <span>{curr.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
