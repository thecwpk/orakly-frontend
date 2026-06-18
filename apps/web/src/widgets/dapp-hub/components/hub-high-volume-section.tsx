"use client";

import Link from "next/link";
import { useOpenTradeModal } from "@/features/trading";
import { useMarketsFeedScopedQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { fmtPct, fmtUsdCompact } from "../lib/format-hub-metrics";
import { marketToTradeModal } from "../lib/open-hub-trade";
import { HubSectionRetry } from "./hub-section-retry";
import { HubSectionShell } from "./hub-section-shell";

export function HubHighVolumeSection() {
  const feedQ = useMarketsFeedScopedQuery({
    scope: "hub",
    lane: "list",
    filter: "high_volume",
    take: 6,
  });
  const openTrade = useOpenTradeModal();

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-high-volume hub-section-glass"
      title="High volume"
      subtitle="Markets with the deepest liquidity."
      action={
        <Link
          href={`${ROUTES.markets}?filter=high_volume`}
          className="hub-btn-secondary px-3 py-2 text-xs"
        >
          View all
        </Link>
      }
    >
      {feedQ.isLoading ? (
        <div className="grid gap-[var(--hub-card-gap)] sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-32 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : feedQ.isError ? (
        <HubSectionRetry onRetry={() => void feedQ.refetch()} />
      ) : (feedQ.data ?? []).length === 0 ? (
        <p className="text-sm text-[var(--hub-muted)]">No high-volume markets yet.</p>
      ) : (
        <div className="grid gap-[var(--hub-card-gap)] sm:grid-cols-2 lg:grid-cols-3">
          {(feedQ.data ?? []).map((m) => (
            <article
              key={m.id}
              className="hub-market-card hub-card-interactive"
            >
              <Link
                href={ROUTES.market(m.slug)}
                className="line-clamp-2 text-sm font-semibold text-[var(--hub-fg)] hover:text-[var(--hub-primary-bright)]"
              >
                {m.title}
              </Link>
              <div className="flex items-end justify-between gap-2 text-xs">
                <span className="text-[var(--hub-muted)]">
                  Vol{" "}
                  <strong className="text-[var(--hub-fg)]">{fmtUsdCompact(m.volumeUsd)}</strong>
                </span>
                <span className="hub-prob-pill text-xs">{fmtPct(m.probability * 100)}</span>
              </div>
              <button
                type="button"
                onClick={() => openTrade(marketToTradeModal(m))}
                className="hub-btn-primary mt-auto w-full py-2 text-xs"
              >
                Trade
              </button>
            </article>
          ))}
        </div>
      )}
    </HubSectionShell>
  );
}
