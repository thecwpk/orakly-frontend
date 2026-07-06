"use client";

import Link from "next/link";
import { Activity, BarChart3, LayoutDashboard, Trophy, Wallet } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

const tiles: {
  href: string;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    href: ROUTES.portfolio,
    title: "Portfolio",
    description: "Positions, balances, and P&L",
    icon: BarChart3,
  },
  {
    href: ROUTES.activity,
    title: "Activity",
    description: "Fills, settlements, and ledger events",
    icon: Activity,
  },
  {
    href: ROUTES.leaderboard,
    title: "Leaderboard",
    description: "Accuracy and rankings",
    icon: Trophy,
  },
  {
    href: ROUTES.analytics,
    title: "Analytics",
    description: "Historical attention and market outcomes",
    icon: BarChart3,
  },
  {
    href: ROUTES.wallet,
    title: "Wallet",
    description: "Connect and session security",
    icon: Wallet,
  },
];

export function UserDashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Account
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Your trading history and analytics live in the sections below. This is separate from the
          operator admin console.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {tiles.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "flex h-full flex-col gap-2 rounded-xl border border-border bg-card/80 p-5 shadow-sm transition",
                "hover:border-yes/30 hover:bg-card",
              )}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-yes/10 text-yes">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-base font-semibold text-foreground">{title}</span>
              <span className="text-sm text-muted-foreground">{description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
