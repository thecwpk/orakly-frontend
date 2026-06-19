"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useOpenTradeModal } from "@/features/trading";
import { useHubTrendingMarketsQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { fmtCents, fmtUsdCompact } from "../lib/format-hub-metrics";
import { marketToTradeModal } from "../lib/open-hub-trade";
import { HubSectionRetry } from "./hub-section-retry";

function TrendingMarketRow({
  title,
  slug,
  probability,
  volume24hUsd,
  onTrade,
}: {
  title: string;
  slug: string;
  probability: number;
  volume24hUsd: number;
  onTrade: () => void;
}) {
  const yesCents = fmtCents(probability);
  const noCents = fmtCents(1 - probability);

  return (
    <article className="hub-market-row">
      <Link href={ROUTES.market(slug)} className="hub-market-row-question min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-[var(--hub-fg)] hover:text-[var(--hub-primary-bright)]">
          {title}
        </p>
        <p className="mt-1 font-mono text-[11px] tabular-nums text-[var(--hub-muted)]">
          {fmtUsdCompact(volume24hUsd)} vol
        </p>
      </Link>
      <div className="hub-market-row-actions shrink-0">
        <button type="button" onClick={onTrade} className="hub-btn-yes hub-market-row-btn">
          Yes {yesCents}
        </button>
        <button type="button" onClick={onTrade} className="hub-btn-no hub-market-row-btn">
          No {noCents}
        </button>
      </div>
    </article>
  );
}

export function HubTrendingMarketsTable() {
  const searchParams = useSearchParams();
  const filter = {
    cat: searchParams?.get("cat"),
    narrative: searchParams?.get("narrative"),
    breaking: searchParams?.get("breaking") === "1",
  };
  const trendingQ = useHubTrendingMarketsQuery(20, filter);
  const openTrade = useOpenTradeModal();
  const markets = trendingQ.data ?? [];

  return (
    <section className="hub-section hub-section--mobile-reorder-trending !pt-4">
      {trendingQ.isError ? (
        <HubSectionRetry onRetry={() => void trendingQ.refetch()} />
      ) : trendingQ.isLoading ? (
        <div className="hub-card divide-y divide-[var(--hub-border)] overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-4">
              <div className="hub-skeleton h-10 w-full" />
            </div>
          ))}
        </div>
      ) : markets.length === 0 ? (
        <p className="text-sm text-[var(--hub-muted)]">—</p>
      ) : (
        <div className="hub-card divide-y divide-[var(--hub-border)] overflow-hidden">
          {markets.map((m) => (
            <TrendingMarketRow
              key={m.id}
              title={m.title}
              slug={m.slug}
              probability={m.probability}
              volume24hUsd={m.volume24hUsd}
              onTrade={() => openTrade(marketToTradeModal(m))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
