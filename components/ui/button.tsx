"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive" | "link";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-gradient-to-r from-brand-500 to-violet-500 text-white shadow-lg hover:shadow-glow-md hover:-translate-y-0.5 active:translate-y-0":
              variant === "default",
            "bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:border-white/20":
              variant === "ghost",
            "border border-brand-500/40 text-brand-400 hover:bg-brand-500/10":
              variant === "outline",
            "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20":
              variant === "destructive",
            "text-brand-400 hover:text-brand-300 underline-offset-4 hover:underline p-0":
              variant === "link",
          },
          {
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
