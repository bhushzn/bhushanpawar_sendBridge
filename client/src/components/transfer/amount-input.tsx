"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  assetCode: string;
  maxBalance?: string;
  onMaxClick?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

function AmountInput({
  value,
  onChange,
  assetCode,
  maxBalance,
  onMaxClick,
  disabled,
  placeholder = "0.00",
}: AmountInputProps) {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      onChange(raw);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleInput}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full h-16 rounded-xl bg-white/5 border border-white/10 pl-4 pr-24 text-2xl font-semibold text-white placeholder-gray-600 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {maxBalance && onMaxClick && (
          <button
            onClick={onMaxClick}
            disabled={disabled}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors px-1.5 py-0.5 rounded-md hover:bg-cyan-400/10"
          >
            MAX
          </button>
        )}
        <Badge variant="default" className="text-xs font-bold px-2.5 py-1">
          {assetCode}
        </Badge>
      </div>
    </div>
  );
}

export { AmountInput };
