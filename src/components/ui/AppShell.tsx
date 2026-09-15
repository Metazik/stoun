"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, SlidersHorizontal, User, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/create", label: "Create", icon: PlusSquare },
  { href: "/studio", label: "Studio", icon: SlidersHorizontal },
  { href: "/profile/you", label: "Profile", icon: User },
];

function useIsActive(href: string) {
  const pathname = usePathname();
  if (href === "/feed") return pathname === "/feed";
  return pathname?.startsWith(href) ?? false;
}

function NavLink({ href, label, Icon }: { href: string; label: string; Icon: typeof Home }) {
  const active = useIsActive(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors md:w-full md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-sm",
        active ? "text-white" : "text-muted hover:text-foreground"
      )}
    >
      <Icon className={cn("h-6 w-6 md:h-5 md:w-5", active && "text-stoun-violet")} strokeWidth={2.2} />
      <span>{label}</span>
    </Link>
  );
}

export function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/90 backdrop-blur-lg md:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} />
      ))}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-background px-3 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stoun-gradient">
          <Music2 className="h-5 w-5 text-white" />
        </div>
        <span className="font-display text-xl font-semibold tracking-tight">Stoun</span>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} />
        ))}
      </div>
    </aside>
  );
}
