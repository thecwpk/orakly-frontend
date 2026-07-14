"use client";

import type { Market } from "@orakly/types";
import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Radio } from "lucide-react";
import Link from "next/link";
import { memo, useEffect } from "react";
import {
  reconcileProbabilityAnchor,
  seedProbabilityHistory,
  useProbabilityHistory,
} from "@/features/markets/store/use-probability-history-store";
import { WatchlistStar } from "@/features/watchlist";
import { ROUTES } from "@/shared/constants/routes";
import { Sparkline } from "@/shared/ui";
import { cn } from "@/lib/utils";

export type MarketsListRowProps = {
  market: Market;
  rank: number;
  isLive?: boolean;
};

function timeUntilClose(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return "—";
  if (ms <= 0) return "closed";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  return `${mo}mo`;
}

function MarketsListRowImpl({ market, rank, isLive }: MarketsListRowProps) {
  const probability = market.probability ?? 0.5;
  const pct = Math.round(probability * 100);

  useEffect(() => {
    seedProbabilityHistory(market.id, probability);
    reconcileProbabilityAnchor(market.id, probability);
  }, [market.id, probability]);

  const history = useProbabilityHistory(market.id);
  const sparkData = history.length > 1 ? history : [probability, probability];

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="group"
    >
      <Link
        href={ROUTES.market(market.slug)}
        className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
      >
        <div
          className={cn(
            "grid items-center gap-2 px-2 py-2 text-[12px] transition-colors duration-150",
            "[grid-template-columns:34px_minmax(0,1fr)_minmax(0,11rem)_5.5rem_5rem_4.5rem_2.25rem_5rem]",
            "border-b border-[var(--hub-border)]",
            "hover:bg-[var(--hub-primary-soft)]/30",
          )}
        >
          <span className="font-mono text-[11px] tabular-nums text-[var(--hub-muted)]">
            #{rank}
          </span>

          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-[var(--hub-fg)]">
                {market.title}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--hub-muted)]">
                <span className="rounded-md bg-[var(--hub-track-bg)] px-1.5 py-0.5 ring-1 ring-[var(--hub-border)]">
                  {market.category}
                </span>
                {isLive ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--hub-success-bg)] px-1.5 py-0.5 text-[var(--hub-success)] ring-1 ring-[var(--hub-border)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Live
                  </span>
                ) : market.status === "OPEN" ? (
                  <span className="inline-flex items-center gap-1 text-[var(--hub-muted)]">
                    <Radio className="h-2.5 w-2.5" />
                    Open
                  </span>
                ) : (
                  <span className="text-[var(--hub-muted)]">{market.status}</span>
                )}
              </div>
            </div>
          </div>

          {/* probability + bar */}
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-wider text-[var(--hub-muted)]">
              <span>YES</span>
              <span className="font-mono text-[13px] font-bold tabular-nums text-[var(--hub-primary-bright)]">
                {pct}%
              </span>
            </div>
            <div className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-[var(--hub-track-bg)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                className="h-full rounded-full bg-[var(--hub-primary)]"
              />
            </div>
          </div>

          {/* sparkline */}
          <Sparkline
            data={sparkData}
            tone={isLive ? "emerald" : "cyan"}
            width={72}
            height={22}
            showLastDot
            ariaLabel={`Probability sparkline for ${market.title}`}
          />

          {/* volume */}
          <div className="text-right">
            <p className="text-[9.5px] uppercase tracking-wider text-[var(--hub-muted)]">
              Vol
            </p>
            <p className="font-mono text-[12px] font-semibold tabular-nums text-[var(--hub-fg)]">
              {formatCompactUsd(market.volumeUsd ?? 0)}
            </p>
          </div>

          {/* liquidity */}
          <div className="hidden text-right md:block">
            <p className="text-[9.5px] uppercase tracking-wider text-[var(--hub-muted)]">
              Liq
            </p>
            <p className="font-mono text-[12px] font-semibold tabular-nums text-[var(--hub-fg)]/90">
              {formatCompactUsd(market.liquidityUsd ?? 0)}
            </p>
          </div>

          {/* watchlist */}
          <div onClick={(e) => e.preventDefault()}>
            <WatchlistStar id={market.id} size="xs" />
          </div>

          {/* closes + cta */}
          <div className="flex items-center justify-end gap-2">
            <span className="hidden items-center gap-1 text-[11px] text-[var(--hub-muted)] md:inline-flex">
              <Clock className="h-3 w-3" />
              {timeUntilClose(market.closesAt)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--hub-primary-soft)] px-2 py-1 text-[11px] font-medium text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition group-hover:bg-[var(--hub-primary)]/25 group-hover:ring-[var(--hub-border-strong)]">
              Trade
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export const MarketsListRow = memo(MarketsListRowImpl);
