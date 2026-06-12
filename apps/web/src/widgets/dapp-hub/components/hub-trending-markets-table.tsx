"use client";

import Link from "next/link";
import { useOpenTradeModal } from "@/features/trading";
import { useHubTrendingMarketsQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { fmtMomentum, fmtPct, fmtUsdCompact } from "../lib/format-hub-metrics";
import { marketToTradeModal } from "../lib/open-hub-trade";
import { HubSectionShell } from "./hub-section-shell";

export function HubTrendingMarketsTable() {
  const trendingQ = useHubTrendingMarketsQuery(20);
  const openTrade = useOpenTradeModal();

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-trending"
      title="Trending Markets"
      subtitle="Where is volume flowing?"
    >
      <div className="hub-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--hub-border)] text-[11px] uppercase tracking-wider text-[var(--hub-muted)]">
              <th className="px-4 py-3 font-medium">Market</th>
              <th className="px-4 py-3 font-medium">Probability</th>
              <th className="px-4 py-3 font-medium">Volume</th>
              <th className="px-4 py-3 font-medium">Attention</th>
              <th className="px-4 py-3 font-medium">Momentum</th>
              <th className="px-4 py-3 font-medium text-right">Trade</th>
            </tr>
          </thead>
          <tbody>
            {trendingQ.isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--hub-border)]">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="hub-skeleton h-6 w-full" />
                    </td>
                  </tr>
                ))
              : (trendingQ.data ?? []).map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-[var(--hub-border)] transition hover:bg-white/[0.02]"
                  >
                    <td className="max-w-[280px] px-4 py-3">
                      <Link
                        href={ROUTES.market(m.slug)}
                        className="line-clamp-2 font-medium text-[var(--hub-fg)] hover:underline"
                      >
                        {m.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-[var(--hub-fg)]">
                      {fmtPct(m.probability * 100)}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-[var(--hub-muted)]">
                      {fmtUsdCompact(m.volume24hUsd)}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-[var(--hub-muted)]">
                      {m.attentionScore != null ? Math.round(m.attentionScore) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-[var(--hub-success)]">
                      {m.momentumPct != null ? fmtMomentum(m.momentumPct) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openTrade(marketToTradeModal(m))}
                        className="rounded-md border border-[var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[var(--hub-fg)] hover:border-[var(--hub-success)] hover:text-[var(--hub-success)]"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!trendingQ.isLoading && (trendingQ.data ?? []).length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--hub-muted)]">No trending markets.</p>
        ) : null}
      </div>
    </HubSectionShell>
  );
}
