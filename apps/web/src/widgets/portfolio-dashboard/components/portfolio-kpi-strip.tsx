"use client";

import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { Briefcase, Percent, PieChart, TrendingUp, Wallet } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";

type Kpi = {
  id: string;
  label: string;
  value: string;
  sub?: string;
  icon: typeof Wallet;
  accent: "cyan" | "emerald" | "violet" | "amber" | "rose";
};

const accentRing: Record<Kpi["accent"], string> = {
  cyan: "ring-cyan-400/25 bg-cyan-500/10 text-cyan-200",
  emerald: "ring-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  violet: "ring-[var(--hub-border)] bg-[var(--hub-primary-soft)] text-violet-200",
  amber: "ring-amber-400/25 bg-amber-500/10 text-amber-200",
  rose: "ring-rose-400/25 bg-rose-500/10 text-rose-200",
};

function PortfolioKpiStripInner({
  availableUsd,
  lockedUsd,
  realizedUsd,
  unrealizedUsd,
  winRatePct,
  positionCount,
}: {
  availableUsd: number;
  lockedUsd: number;
  realizedUsd: number;
  unrealizedUsd: number;
  winRatePct: number | null;
  positionCount: number;
}) {
  const totalPnl = realizedUsd + unrealizedUsd;
  const pnlPos = totalPnl >= 0;

  const kpis: Kpi[] = [
    {
      id: "avail",
      label: "Available",
      value: formatCompactUsd(availableUsd),
      sub: "Cash",
      icon: Wallet,
      accent: "emerald",
    },
    {
      id: "lock",
      label: "Locked",
      value: formatCompactUsd(lockedUsd),
      sub: "In orders",
      icon: PieChart,
      accent: "amber",
    },
    {
      id: "pnl",
      label: "Total PnL",
      value:
        totalPnl === 0
          ? formatCompactUsd(0)
          : `${pnlPos ? "+" : ""}${formatCompactUsd(Math.abs(totalPnl))}`,
      sub: "R + U",
      icon: TrendingUp,
      accent: pnlPos ? "emerald" : "rose",
    },
    {
      id: "win",
      label: "Win rate",
      value: winRatePct != null ? `${Math.round(winRatePct * 10) / 10}%` : "—",
      sub: "FIFO exits",
      icon: Percent,
      accent: "violet",
    },
    {
      id: "pos",
      label: "Open positions",
      value: String(positionCount),
      sub: "Markets",
      icon: Briefcase,
      accent: "cyan",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
    >
      {kpis.map((k, i) => {
        const Icon = k.icon;
        const isPnl = k.id === "pnl";
        return (
          <motion.div
            key={k.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className={cn(
              "relative overflow-hidden rounded-xl px-3 py-2.5 ring-1",
              "bg-[#0c0c14]/90 backdrop-blur-sm",
              accentRing[k.accent],
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
                  {k.label}
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-lg font-semibold leading-none tracking-tight tabular-nums sm:text-xl",
                    isPnl && (pnlPos ? "text-emerald-200" : "text-rose-200"),
                    !isPnl && "text-[var(--hub-fg)]",
                  )}
                >
                  {k.value}
                </p>
                {k.sub ? (
                  <p className="mt-1 font-mono text-[9px] text-[var(--hub-muted)]">{k.sub}</p>
                ) : null}
              </div>
              <Icon className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export const PortfolioKpiStrip = memo(PortfolioKpiStripInner);
