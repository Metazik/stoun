"use client";

import { cn } from "@/lib/utils";

export function Tag({
  children,
  active,
  onClick,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const isInteractive = typeof onClick === "function";
  const Comp = isInteractive ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      type={isInteractive ? "button" : undefined}
      className={cn(
        "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-stoun-gradient text-white"
          : "border-border bg-surface text-muted hover:text-foreground hover:border-white/30",
        className
      )}
    >
      {children}
    </Comp>
  );
}
