import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-cyan-600/20 text-cyan-400 border border-cyan-600/30",
        success:
          "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30",
        warning:
          "bg-amber-600/20 text-amber-400 border border-amber-600/30",
        danger: "bg-red-600/20 text-red-400 border border-red-600/30",
        outline: "bg-transparent text-gray-400 border border-white/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
