"use client";

import Link from "next/link";
import { useOpenTradeModal } from "@/features/trading";
import { useMarketsFeedScopedQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { fmtPct, fmtUsdCompact } from "../lib/format-hub-metrics";
import { marketToTradeModal } from "../lib/open-hub-trade";
import { HubProbabilityBar } from "./hub-probability-bar";
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
      action={
        <Link href={`${ROUTES.markets}?filter=high_volume`} className="hub-btn-secondary px-3 py-1.5 text-xs">
          All
        </Link>
      }
    >
      {feedQ.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-36 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : feedQ.isError ? (
        <HubSectionRetry onRetry={() => void feedQ.refetch()} />
      ) : (feedQ.data ?? []).length === 0 ? (
        <p className="text-sm text-[var(--hub-muted)]">—</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(feedQ.data ?? []).map((m) => (
            <article key={m.id} className="hub-market-card hub-card-interactive">
              <Link
                href={ROUTES.market(m.slug)}
                className="line-clamp-2 text-sm font-semibold text-[var(--hub-fg)] hover:text-[var(--hub-primary-bright)]"
              >
                {m.title}
              </Link>
              <HubProbabilityBar probability={m.probability} size="sm" />
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono tabular-nums text-[var(--hub-muted)]">
                  {fmtUsdCompact(m.volumeUsd)}
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
