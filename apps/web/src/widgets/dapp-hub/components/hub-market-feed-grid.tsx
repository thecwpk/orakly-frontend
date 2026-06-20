"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useOpenTradeModal } from "@/features/trading";
import { useHubTrendingMarketsQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { fmtCents, fmtUsdCompact } from "../lib/format-hub-metrics";
import { resolveHubMarketVisual } from "../lib/hub-market-visual";
import { marketToTradeModal } from "../lib/open-hub-trade";
import { HubFeedSectionHeader } from "./hub-feed-section-header";
import { HubSectionRetry } from "./hub-section-retry";

function HubFeedCard({
  title,
  slug,
  category,
  probability,
  volume24hUsd,
  onTrade,
}: {
  title: string;
  slug: string;
  category?: string | null;
  probability: number;
  volume24hUsd: number;
  onTrade: () => void;
}) {
  const visual = resolveHubMarketVisual(category, title);
  const ThumbIcon = visual.Icon;
  const yesCents = fmtCents(probability);
  const noCents = fmtCents(1 - probability);

  return (
    <article className="hub-feed-card">
      <div
        className="hub-feed-card-thumb"
        style={{ backgroundColor: visual.bg }}
        aria-hidden
      >
        <ThumbIcon className="hub-feed-card-thumb-icon" style={{ color: visual.iconColor }} />
      </div>
      <div className="hub-feed-card-body">
        <div className="hub-feed-card-meta">
          {category ? <span className="hub-feed-card-category">{category}</span> : null}
          <span className="hub-feed-card-vol">{fmtUsdCompact(volume24hUsd)} vol</span>
        </div>
        <Link href={ROUTES.market(slug)} className="hub-feed-card-title">
          {title}
        </Link>
        <div className="hub-feed-card-outcomes">
          <button type="button" onClick={onTrade} className="hub-outcome-btn hub-outcome-btn--yes">
            <span className="hub-outcome-label">Yes</span>
            <span className="hub-outcome-price">{yesCents}</span>
          </button>
          <button type="button" onClick={onTrade} className="hub-outcome-btn hub-outcome-btn--no">
            <span className="hub-outcome-label">No</span>
            <span className="hub-outcome-price">{noCents}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/** Polymarket-style card grid — primary `/dapp` feed. */
export function HubMarketFeedGrid() {
  const searchParams = useSearchParams();
  const filter = {
    cat: searchParams?.get("cat"),
    narrative: searchParams?.get("narrative"),
    breaking: searchParams?.get("breaking") === "1",
  };
  const trendingQ = useHubTrendingMarketsQuery(60, filter);
  const openTrade = useOpenTradeModal();
  const markets = trendingQ.data ?? [];

  return (
    <section className="hub-feed-section" aria-label="Markets">
      <HubFeedSectionHeader marketCount={markets.length} />
      {trendingQ.isError ? (
        <HubSectionRetry onRetry={() => void trendingQ.refetch()} />
      ) : trendingQ.isLoading ? (
        <div className="hub-feed-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="hub-skeleton hub-feed-card-skeleton" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--hub-muted)]">No markets match this filter.</p>
      ) : (
        <div className="hub-feed-grid">
          {markets.map((m) => (
            <HubFeedCard
              key={m.id}
              title={m.title}
              slug={m.slug}
              category={m.category}
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
