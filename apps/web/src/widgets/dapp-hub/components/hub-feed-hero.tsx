"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useHomeStatsQuery,
  useHubMarketsPreviewQuery,
  useHubTrendingMarketsQuery,
} from "@/shared/api/hooks";
import { useLiveMarketStatus } from "@/widgets/trending-prediction-markets/lib/use-live-market-status";
import {
  buildHeroSpotlight,
  buildHeroTrendRail,
  resolveHeroActiveMarket,
} from "../lib/hub-hero-markets";
import { fmtCount, fmtUsdCompact } from "../lib/format-hub-metrics";
import { HubFeaturedTradingCard } from "./hub-featured-trading-card";
import { HubHeroTrendsRail } from "./hub-hero-trends-rail";
import { HubSpotlightCarouselNav } from "./hub-spotlight-desk";

/** Hero — left trending slider + right featured market chart, then feed below. */
export function HubFeedHero() {
  const trendingQ = useHubTrendingMarketsQuery(12);
  const previewQ = useHubMarketsPreviewQuery();
  const statsQ = useHomeStatsQuery();

  const trendRail = useMemo(
    () =>
      buildHeroTrendRail(
        trendingQ.data ?? [],
        previewQ.data?.breaking ?? [],
        previewQ.data?.hotTopics ?? previewQ.data?.trendingHot ?? [],
      ),
    [trendingQ.data, previewQ.data],
  );

  const spotlight = useMemo(
    () => buildHeroSpotlight(previewQ.data ?? null, trendingQ.data ?? []),
    [previewQ.data, trendingQ.data],
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const activeMarket = useMemo(
    () => resolveHeroActiveMarket(trendRail, spotlight, activeId),
    [trendRail, spotlight, activeId],
  );

  const spotlightIndex = useMemo(() => {
    if (!activeMarket) return 0;
    const idx = spotlight.findIndex((m) => m.id === activeMarket.id);
    return idx >= 0 ? idx : 0;
  }, [activeMarket, spotlight]);

  const heroIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of trendRail) ids.add(m.id);
    for (const m of spotlight) ids.add(m.id);
    return [...ids];
  }, [trendRail, spotlight]);

  const { liveSet } = useLiveMarketStatus(heroIds);

  useEffect(() => {
    if (!activeId && (spotlight[0]?.id ?? trendRail[0]?.id)) {
      setActiveId(spotlight[0]?.id ?? trendRail[0]?.id ?? null);
    }
  }, [activeId, spotlight, trendRail]);

  const loading = trendingQ.isLoading && !trendRail.length;
  const stats = statsQ.data;

  return (
    <section className="hub-feed-hero" aria-label="Trending spotlight">
      <div className="hub-container">
        <div className="hub-feed-hero-stats">
          <div className="hub-feed-hero-stat">
            <span className="hub-feed-hero-stat-val">
              {stats ? fmtCount(stats.liveMarkets) : "—"}
            </span>
            <span className="hub-feed-hero-stat-label">Live markets</span>
          </div>
          <div className="hub-feed-hero-stat">
            <span className="hub-feed-hero-stat-val">
              {stats ? fmtUsdCompact(stats.volume24hUsd) : "—"}
            </span>
            <span className="hub-feed-hero-stat-label">24h volume</span>
          </div>
          <div className="hub-feed-hero-stat">
            <span className="hub-feed-hero-stat-val">
              {stats ? fmtCount(stats.activeNarratives) : "—"}
            </span>
            <span className="hub-feed-hero-stat-label">Narratives</span>
          </div>
          <div className="hub-feed-hero-stat">
            <span className="hub-feed-hero-stat-val">
              {stats ? fmtCount(stats.attentionUpdates24h) : "—"}
            </span>
            <span className="hub-feed-hero-stat-label">Updates today</span>
          </div>
        </div>

        <div className="hub-feed-hero-grid">
          <HubHeroTrendsRail
            markets={trendRail}
            activeId={activeMarket?.id ?? null}
            onSelect={setActiveId}
            loading={loading}
            liveSet={liveSet}
          />

          <div className="hub-feed-hero-spotlight">
            {activeMarket ? (
              <>
                <div className="hub-feed-hero-featured">
                  <HubFeaturedTradingCard
                    market={activeMarket}
                    isLive={liveSet.has(activeMarket.id)}
                    queueMerged={spotlight.length > 1}
                  />
                </div>
                {spotlight.length > 1 ? (
                  <HubSpotlightCarouselNav
                    markets={spotlight}
                    index={spotlightIndex}
                    onChange={(idx) => setActiveId(spotlight[idx]?.id ?? null)}
                    mergedUnderFeatured
                  />
                ) : null}
              </>
            ) : loading ? (
              <div className="hub-skeleton hub-feed-hero-spotlight-skeleton" aria-busy />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
