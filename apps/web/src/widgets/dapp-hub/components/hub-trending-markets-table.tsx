"use client";

import Link from "next/link";
import { useOpenTradeModal } from "@/features/trading";
import { useHubTrendingMarketsQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { fmtMomentum, fmtPct, fmtUsdCompact } from "../lib/format-hub-metrics";
import { marketToTradeModal } from "../lib/open-hub-trade";
import { HubProbabilityBar } from "./hub-probability-bar";
import { HubSectionRetry } from "./hub-section-retry";
import { HubSectionShell } from "./hub-section-shell";

function TrendingMarketCard({
  title,
  slug,
  probability,
  volume24hUsd,
  momentumPct,
  onTrade,
}: {
  title: string;
  slug: string;
  probability: number;
  volume24hUsd: number;
  momentumPct: number | null | undefined;
  onTrade: () => void;
}) {
  const yesPct = probability * 100;
  const noPct = 100 - yesPct;
  const maxVol = 2_100_000;
  const volWidth = `${Math.min(100, Math.max(12, (volume24hUsd / maxVol) * 100))}%`;

  return (
    <article className="hub-market-card">
      <Link
        href={ROUTES.market(slug)}
        className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[var(--hub-fg)] hover:text-[var(--hub-primary-bright)]"
      >
        {title}
      </Link>

      <HubProbabilityBar probability={probability} />

      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <div>
          <div className="mb-1 h-1 overflow-hidden rounded-full bg-[rgba(15,30,55,0.85)]">
            <div
              className="h-full rounded-full bg-[var(--hub-primary)]/70"
              style={{ width: volWidth }}
            />
          </div>
          <span className="font-mono text-[11px] tabular-nums text-[var(--hub-muted)]">
            {fmtUsdCompact(volume24hUsd)}
          </span>
        </div>
        {momentumPct != null ? (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
              momentumPct >= 0
                ? "bg-[rgba(52,211,153,0.12)] text-[var(--hub-success)]"
                : "bg-[rgba(248,113,113,0.12)] text-[var(--hub-danger)]",
            )}
          >
            {fmtMomentum(momentumPct)}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onTrade}
          className="hub-btn-yes rounded-lg py-2 text-xs font-bold"
        >
          Yes {fmtPct(yesPct)}
        </button>
        <button
          type="button"
          onClick={onTrade}
          className="hub-btn-no rounded-lg py-2 text-xs font-bold"
        >
          No {fmtPct(noPct)}
        </button>
      </div>
    </article>
  );
}

export function HubTrendingMarketsTable() {
  const trendingQ = useHubTrendingMarketsQuery(12);
  const openTrade = useOpenTradeModal();
  const markets = trendingQ.data ?? [];

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-trending hub-section-glass !pt-3"
      title="Trending"
      action={
        <Link href={ROUTES.markets} className="hub-btn-secondary px-3 py-1.5 text-xs">
          All
        </Link>
      }
    >
      {trendingQ.isError ? (
        <HubSectionRetry onRetry={() => void trendingQ.refetch()} />
      ) : trendingQ.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-44 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <p className="text-sm text-[var(--hub-muted)]">—</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {markets.map((m) => (
            <TrendingMarketCard
              key={m.id}
              title={m.title}
              slug={m.slug}
              probability={m.probability}
              volume24hUsd={m.volume24hUsd}
              momentumPct={m.momentumPct}
              onTrade={() => openTrade(marketToTradeModal(m))}
            />
          ))}
        </div>
      )}
    </HubSectionShell>
  );
}
