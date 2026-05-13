"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, BarChart3, Target, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { compactUsd, signedCompactUsd } from "../lib/format";

export type LeaderboardStatsStripProps = {
  totalVolumeUsd: number;
  totalPnlUsd: number;
  averageWinRatePct: number;
  totalTrades: number;
  flux: { climbed: number; dropped: number; held: number };
  /** Display label for the active window (e.g. `7d`, `30d`). */
  windowLabel: string;
  className?: string;
};

export function LeaderboardStatsStrip({
  totalVolumeUsd,
  totalPnlUsd,
  averageWinRatePct,
  totalTrades,
  flux,
  windowLabel,
  className,
}: LeaderboardStatsStripProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Leaderboard summary"
      className={cn("grid grid-cols-2 gap-r16 sm:grid-cols-4", className)}
    >
      <Card
        icon={BarChart3}
        tone="cyan"
        label="Total volume"
        value={compactUsd(totalVolumeUsd)}
        hint={`${windowLabel} · across top traders`}
      />
      <Card
        icon={TrendingUp}
        tone={totalPnlUsd >= 0 ? "emerald" : "rose"}
        label="Aggregate PnL"
        value={signedCompactUsd(totalPnlUsd)}
        hint={`${windowLabel} · realized + unrealized`}
      />
      <Card
        icon={Target}
        tone="violet"
        label="Avg win rate"
        value={`${averageWinRatePct.toFixed(1)}%`}
        hint={`${totalTrades.toLocaleString()} trades`}
      />
      <Card
        icon={Trophy}
        tone="amber"
        label="Rank moves"
        value={
          <span className="flex items-baseline gap-1.5 font-mono text-[18px] font-semibold leading-none">
            <span className="inline-flex items-center gap-0.5 text-emerald-200">
              <ArrowUp className="h-3.5 w-3.5" />
              {flux.climbed}
            </span>
            <span className="inline-flex items-center gap-0.5 text-rose-200">
              <ArrowDown className="h-3.5 w-3.5" />
              {flux.dropped}
            </span>
          </span>
        }
        hint={`${flux.held} held position`}
      />
    </motion.section>
  );
}

function Card({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: typeof BarChart3;
  tone: "cyan" | "emerald" | "rose" | "violet" | "amber";
  label: string;
  value: React.ReactNode;
  hint: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    cyan: "bg-cyan-500/10 text-cyan-200 ring-cyan-400/25",
    emerald: "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25",
    rose: "bg-rose-500/10 text-rose-200 ring-rose-400/25",
    violet: "bg-violet-500/10 text-violet-200 ring-violet-400/25",
    amber: "bg-amber-500/10 text-amber-200 ring-amber-400/25",
  };

  return (
    <div className="glass-panel-strong rounded-xl p-3.5 ring-1 ring-white/[0.06]">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md ring-1",
            toneClasses[tone],
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          {label}
        </span>
      </div>
      <div className="mt-2 font-mono text-[18px] font-semibold leading-none tabular-nums text-zinc-100">
        {value}
      </div>
      <p className="mt-1.5 truncate text-[10.5px] text-zinc-500">{hint}</p>
    </div>
  );
}
