"use client";

import Link from "next/link";
import { useOpenTradeModal } from "@/features/trading";
import { useHubTrendingMarketsQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { fmtMomentum, fmtPct, fmtUsdCompact } from "../lib/format-hub-metrics";
import { marketToTradeModal } from "../lib/open-hub-trade";
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
  return (
    <article className="hub-market-card">
      <Link
        href={ROUTES.market(slug)}
        className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--hub-fg)] hover:text-[var(--hub-primary-bright)]"
      >
        {title}
      </Link>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 text-xs text-[var(--hub-muted)]">
          <span>
            Vol <strong className="text-[var(--hub-fg)]">{fmtUsdCompact(volume24hUsd)}</strong>
          </span>
          {momentumPct != null ? (
            <span
              className={cn(
                "font-mono tabular-nums",
                momentumPct >= 0 ? "text-[var(--hub-success)]" : "text-[var(--hub-danger)]",
              )}
            >
              {fmtMomentum(momentumPct)}
            </span>
          ) : null}
        </div>
        <span className="hub-prob-pill">{fmtPct(probability * 100)}</span>
      </div>
      <button type="button" onClick={onTrade} className="hub-btn-primary w-full py-2.5">
        Trade
      </button>
    </article>
  );
}

export function HubTrendingMarketsTable() {
  const trendingQ = useHubTrendingMarketsQuery(12);
  const openTrade = useOpenTradeModal();
  const markets = trendingQ.data ?? [];

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-trending hub-section-glass"
      title="Trending markets"
      subtitle="Most active markets right now — tap to trade or open details."
      action={
        <Link href={ROUTES.markets} className="hub-btn-secondary px-3 py-2 text-xs">
          View all
        </Link>
      }
    >
      {trendingQ.isError ? (
        <HubSectionRetry onRetry={() => void trendingQ.refetch()} />
      ) : trendingQ.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-36 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <p className="text-sm text-[var(--hub-muted)]">No trending markets yet.</p>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {markets.slice(0, 8).map((m) => (
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

          <div className="hub-card hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--hub-border)] text-[11px] uppercase tracking-wider text-[var(--hub-muted)]">
                  <th className="px-4 py-3 font-medium">Market</th>
                  <th className="px-4 py-3 font-medium">Chance</th>
                  <th className="px-4 py-3 font-medium">Volume</th>
                  <th className="px-4 py-3 font-medium">Momentum</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-[var(--hub-border)] transition last:border-b-0 hover:bg-[var(--hub-primary-soft)]"
                  >
                    <td className="max-w-[320px] px-4 py-3">
                      <Link
                        href={ROUTES.market(m.slug)}
                        className="line-clamp-2 font-medium text-[var(--hub-fg)] hover:text-[var(--hub-primary-bright)]"
                      >
                        {m.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="hub-prob-pill text-xs">{fmtPct(m.probability * 100)}</span>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-[var(--hub-muted)]">
                      {fmtUsdCompact(m.volume24hUsd)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 font-mono text-xs tabular-nums",
                        m.momentumPct != null && m.momentumPct >= 0
                          ? "text-[var(--hub-success)]"
                          : "text-[var(--hub-danger)]",
                      )}
                    >
                      {m.momentumPct != null ? fmtMomentum(m.momentumPct) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openTrade(marketToTradeModal(m))}
                        className="hub-btn-primary px-4 py-1.5 text-xs"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </HubSectionShell>
  );
}
