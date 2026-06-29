"use client";

import { Activity, Target, TrendingUp, Wallet, Zap } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ProfileStats } from "../lib/types";
import { AnimatedStat } from "./animated-stat";

function ProfileStatsGridInner({
  stats,
  className,
}: {
  stats: ProfileStats;
  className?: string;
}) {
  return (
    <section
      aria-label="Trading statistics"
      className={cn("grid grid-cols-2 gap-r16 sm:grid-cols-3 lg:grid-cols-5", className)}
    >
      <AnimatedStat
        label="ROI"
        value={stats.roiPct}
        format="signed-pct"
        tone={stats.roiPct >= 0 ? "emerald" : "rose"}
        hint="Net return / capital"
        icon={<TrendingUp className="h-3 w-3 text-emerald-300" />}
      />
      <AnimatedStat
        label="Best trade"
        value={stats.bestTradeUsd}
        format="usd"
        tone="amber"
        hint="Single fill"
        icon={<Zap className="h-3 w-3 text-amber-300" />}
      />
      <AnimatedStat
        label="Avg ticket"
        value={stats.avgTicketUsd}
        format="usd"
        tone="cyan"
        hint="Avg notional"
        icon={<Wallet className="h-3 w-3 text-[var(--hub-primary-bright)]" />}
      />
      <AnimatedStat
        label="Streak"
        value={stats.streak}
        format="int"
        tone="violet"
        hint="Consecutive wins"
        icon={<Target className="h-3 w-3 text-[var(--hub-primary-bright)]" />}
      />
      <AnimatedStat
        label="Trades"
        value={stats.trades}
        format="int"
        tone="neutral"
        hint="Closed in window"
        icon={<Activity className="h-3 w-3 text-[var(--hub-muted)]" />}
      />
    </section>
  );
}

export const ProfileStatsGrid = memo(ProfileStatsGridInner);
