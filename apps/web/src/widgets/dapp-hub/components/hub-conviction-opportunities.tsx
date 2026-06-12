"use client";

import Link from "next/link";
import { useOpenTradeModal } from "@/features/trading";
import { useConvictionMarketsQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { fmtPct, fmtUsdCompact } from "../lib/format-hub-metrics";
import { marketToTradeModal } from "../lib/open-hub-trade";
import { HubSectionRetry } from "./hub-section-retry";
import { HubSectionShell } from "./hub-section-shell";

function formatEndDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function HubConvictionOpportunities() {
  const convictionQ = useConvictionMarketsQuery(6);
  const openTrade = useOpenTradeModal();

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-conviction"
      title="Highest Conviction Opportunities"
      subtitle="Markets with the strongest crowd positioning."
    >
      {convictionQ.isLoading ? (
        <div className="grid gap-[var(--hub-card-gap)] sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-44 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : convictionQ.isError ? (
        <HubSectionRetry onRetry={() => void convictionQ.refetch()} />
      ) : (convictionQ.data ?? []).length === 0 ? (
        <p className="text-sm text-[var(--hub-muted)]">No open markets yet.</p>
      ) : (
        <div className="grid gap-[var(--hub-card-gap)] sm:grid-cols-2 lg:grid-cols-3">
          {(convictionQ.data ?? []).map((m) => (
            <article key={m.id} className="hub-card flex flex-col gap-3 p-4">
              <Link
                href={ROUTES.market(m.slug)}
                className="line-clamp-2 text-sm font-semibold text-[var(--hub-fg)] hover:underline"
              >
                {m.title}
              </Link>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[var(--hub-muted)]">
                <span>
                  Probability{" "}
                  <strong className="text-[var(--hub-fg)]">
                    {fmtPct(m.probability * 100)}
                  </strong>
                </span>
                <span>
                  Conviction{" "}
                  <strong className="text-[var(--hub-attention)]">{m.conviction}</strong>
                </span>
                <span>
                  Attention{" "}
                  <strong className="text-[var(--hub-fg)]">
                    {m.attentionScore != null ? Math.round(m.attentionScore) : "—"}
                  </strong>
                </span>
                <span>
                  Volume{" "}
                  <strong className="text-[var(--hub-fg)]">
                    {fmtUsdCompact(m.volume24hUsd)}
                  </strong>
                </span>
              </div>
              <p className="text-[11px] text-[var(--hub-muted)]">Ends {formatEndDate(m.closesAt)}</p>
              <button
                type="button"
                onClick={() => openTrade(marketToTradeModal(m))}
                className="mt-auto w-full rounded-lg bg-[var(--hub-success)] py-2 text-sm font-semibold text-[#090909] hover:opacity-90"
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
