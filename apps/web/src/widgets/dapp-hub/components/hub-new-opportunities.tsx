"use client";

import { useHubMarketsPreviewQuery } from "@/shared/api/hooks";
import { useOpenTradeModal } from "@/features/trading";
import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { fmtPct, fmtUsdCompact } from "../lib/format-hub-metrics";
import { marketToTradeModal } from "../lib/open-hub-trade";
import { HubSectionShell } from "./hub-section-shell";

export function HubNewOpportunities() {
  const hubQ = useHubMarketsPreviewQuery();
  const openTrade = useOpenTradeModal();
  const markets = (hubQ.data?.trendingNew ?? []).slice(0, 6);

  return (
    <HubSectionShell
      className="hub-section--desktop-only"
      title="New Opportunities"
      subtitle="Discover markets early."
    >
      {hubQ.isLoading ? (
        <div className="grid gap-[var(--hub-card-gap)] sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-36 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <p className="text-sm text-[var(--hub-muted)]">No new markets yet.</p>
      ) : (
        <div className="grid gap-[var(--hub-card-gap)] sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((m) => (
            <article key={m.id} className="hub-card flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={ROUTES.market(m.slug)}
                  className="line-clamp-2 text-sm font-semibold text-[var(--hub-fg)] hover:underline"
                >
                  {m.title}
                </Link>
                <span className="shrink-0 rounded bg-[var(--hub-attention)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--hub-attention)]">
                  New
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-[var(--hub-muted)]">
                <span>
                  Prob{" "}
                  <strong className="text-[var(--hub-fg)]">
                    {fmtPct(m.probability * 100)}
                  </strong>
                </span>
                <span>
                  Vol{" "}
                  <strong className="text-[var(--hub-fg)]">
                    {fmtUsdCompact(m.volumeUsd)}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => openTrade(marketToTradeModal(m))}
                className="mt-auto w-full rounded-lg border border-[var(--hub-border)] py-2 text-sm font-semibold text-[var(--hub-fg)] hover:border-[var(--hub-success)] hover:text-[var(--hub-success)]"
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
