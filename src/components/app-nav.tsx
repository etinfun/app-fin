"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  PiggyBank,
  TrendingUp,
  Wallet,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Activity", icon: List },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/projection", label: "Plan", icon: TrendingUp },
  { href: "/balances", label: "Balances", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function AppNav() {
  const pathname = usePathname();

  if (pathname === "/add" || pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[52px] min-w-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
