"use client";

import { useAttentionDashboardQuery, useHomeStatsQuery } from "@/shared/api/hooks";
import { cn } from "@/lib/utils";
import { fmtCount, fmtUsdCompact } from "../lib/format-hub-metrics";
import { HubMomentumBars } from "./hub-momentum-bars";

/** Compact trader HUD — numbers + momentum chart, no copy. */
export function HubTraderStrip() {
  const statsQ = useHomeStatsQuery();
  const attentionQ = useAttentionDashboardQuery();
  const stats = statsQ.data;

  return (
    <section className="hub-section hub-section--mobile-reorder-strip !gap-4 !pt-4 sm:!pt-5">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {statsQ.isLoading ? (
          <>
            <div className="hub-skeleton h-8 w-28 rounded-full" />
            <div className="hub-skeleton h-8 w-24 rounded-full" />
            <div className="hub-skeleton h-8 w-24 rounded-full" />
          </>
        ) : (
          <>
            <span className="hub-stat-chip font-mono text-sm font-bold tabular-nums text-[var(--hub-primary-bright)]">
              {stats ? fmtUsdCompact(stats.volume24hUsd) : "—"}
              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-muted)]">
                24h
              </span>
            </span>
            <span className="hub-stat-chip">
              <strong className="font-mono text-sm tabular-nums text-[var(--hub-fg)]">
                {stats ? fmtCount(stats.liveMarkets) : "—"}
              </strong>
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-muted)]">
                markets
              </span>
            </span>
            <span className="hub-stat-chip">
              <strong className="font-mono text-sm tabular-nums text-[var(--hub-fg)]">
                {stats ? fmtCount(stats.activeNarratives) : "—"}
              </strong>
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-muted)]">
                narratives
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hub-border-strong)] bg-[var(--hub-primary-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-primary-bright)]">
              <span
                className={cn(
                  "size-1.5 rounded-full bg-[var(--hub-primary)]",
                  attentionQ.isFetching && "animate-pulse",
                )}
                aria-hidden
              />
              Live
            </span>
          </>
        )}
      </div>

      <div className="hub-card p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--hub-muted)]">
            Momentum
          </span>
        </div>
        <HubMomentumBars
          rows={attentionQ.data ?? []}
          loading={attentionQ.isLoading}
          maxItems={6}
        />
      </div>
    </section>
  );
}
