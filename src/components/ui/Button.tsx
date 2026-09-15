"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-stoun-gradient text-white shadow-glow hover:brightness-110",
  secondary: "bg-surface-raised text-foreground hover:bg-white/10",
  ghost: "bg-transparent text-foreground hover:bg-white/5",
  outline: "bg-transparent border border-border text-foreground hover:bg-white/5",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 rounded-full gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-full gap-2",
  lg: "text-base px-6 py-3.5 rounded-full gap-2.5",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
