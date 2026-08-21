"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "right" | "bottom";
  children: React.ReactNode;
}

function Sheet({ open, onOpenChange, side = "right", children }: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (typeof document === "undefined") return null;

  const isRight = side === "right";

  return createPortal(
    <div className={cn("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed z-50 bg-[#111827]/95 backdrop-blur-xl border-white/10 shadow-2xl transition-transform duration-300 ease-in-out",
          isRight && "top-0 right-0 h-full w-80 border-l",
          !isRight && "bottom-0 left-0 right-0 border-t rounded-t-2xl max-h-[80vh]",
          isRight && open && "translate-x-0",
          isRight && !open && "translate-x-full",
          !isRight && open && "translate-y-0",
          !isRight && !open && "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="font-semibold text-white">Menu</span>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export { Sheet };
