"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  label?: string;
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ className, active, label, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          "flex flex-col items-center justify-center gap-1 text-white transition-transform active:scale-90",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-colors",
            active ? "bg-stoun-gradient" : "bg-black/30 hover:bg-black/45"
          )}
        >
          {children}
        </span>
        {label ? <span className="text-[11px] font-medium drop-shadow">{label}</span> : null}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
