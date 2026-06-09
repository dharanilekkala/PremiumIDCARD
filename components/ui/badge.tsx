import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-brand-500/10 text-brand-400 border border-brand-500/20": variant === "default",
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20": variant === "success",
          "bg-amber-500/10 text-amber-400 border border-amber-500/20": variant === "warning",
          "bg-red-500/10 text-red-400 border border-red-500/20": variant === "danger",
          "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
}
