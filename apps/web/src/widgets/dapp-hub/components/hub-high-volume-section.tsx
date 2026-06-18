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
    take: 8,
  });
  const openTrade = useOpenTradeModal();

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-high-volume hub-section-glass"
      title="High Volume Markets"
      subtitle="Largest cumulative traded notional across open markets."
      action={
        <Link
          href={`${ROUTES.markets}?filter=high_volume`}
          className="text-xs font-semibold text-[var(--hub-muted)] hover:text-[var(--hub-fg)]"
        >
          View all
        </Link>
      }
    >
      {feedQ.isLoading ? (
        <div className="grid gap-[var(--hub-card-gap)] sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-32 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : feedQ.isError ? (
        <HubSectionRetry onRetry={() => void feedQ.refetch()} />
      ) : (feedQ.data ?? []).length === 0 ? (
        <p className="text-sm text-[var(--hub-muted)]">No high-volume markets yet.</p>
      ) : (
        <div className="grid gap-[var(--hub-card-gap)] sm:grid-cols-2 lg:grid-cols-4">
          {(feedQ.data ?? []).map((m) => (
            <article
              key={m.id}
              className="hub-card hub-card-interactive flex flex-col gap-2 p-4"
            >
              <Link
                href={ROUTES.market(m.slug)}
                className="line-clamp-2 text-sm font-semibold text-[var(--hub-fg)] hover:underline"
              >
                {m.title}
              </Link>
              <div className="flex items-end justify-between gap-2 text-xs">
                <span className="text-[var(--hub-muted)]">
                  Vol{" "}
                  <strong className="text-[var(--hub-fg)]">
                    {fmtUsdCompact(m.volumeUsd)}
                  </strong>
                </span>
                <span className="font-mono tabular-nums text-[var(--hub-attention)]">
                  {fmtPct(m.probability * 100)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openTrade(marketToTradeModal(m))}
                className="mt-auto w-full rounded-lg border border-[var(--hub-border)] py-2 text-xs font-semibold text-[var(--hub-fg)] transition hover:border-[var(--hub-success)] hover:text-[var(--hub-success)]"
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
