import { pickCrossLaneHotMarkets } from "@/widgets/dapp-hub/lib/hub-cross-lane-hot-topics";
import type { HubMarketsPreviewPayload } from "@/shared/contracts/hub-markets-preview";
import { getMarketsFeedScoped } from "./markets-feed-scoped";

export function hubMoversRankingEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_HUB_MOVERS_RANKING?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Bundles hub lanes in parallel for `GET /api/v1/markets/hub-preview`.
 * When `NEXT_PUBLIC_HUB_MOVERS_RANKING` is set, includes `movers_24h` for the Breaking composite.
 */
export async function getHubMarketsPreview(): Promise<HubMarketsPreviewPayload> {
  const moversEnabled = hubMoversRankingEnabled();

  const [
    trendingList,
    breaking,
    trendingTape,
    trendingActivity,
    trendingHot,
    trendingNew,
    movers24h,
  ] = await Promise.all([
    getMarketsFeedScoped({
      scope: "hub",
      lane: "list",
      listFilter: "trending",
      take: 28,
      staticFallback: false,
    }),
    getMarketsFeedScoped({
      scope: "hub",
      lane: "list",
      listFilter: "breaking",
      take: 24,
      staticFallback: false,
    }),
    getMarketsFeedScoped({
      scope: "hub",
      lane: "trending",
      trendingBy: "volume",
      take: 28,
      staticFallback: false,
    }),
    getMarketsFeedScoped({
      scope: "hub",
      lane: "trending",
      trendingBy: "activity",
      take: 28,
      staticFallback: false,
    }),
    getMarketsFeedScoped({
      scope: "hub",
      lane: "trending",
      trendingBy: "hot",
      take: 28,
      staticFallback: false,
    }),
    getMarketsFeedScoped({
      scope: "hub",
      lane: "trending",
      trendingBy: "new",
      take: 28,
      staticFallback: false,
    }),
    moversEnabled
      ? getMarketsFeedScoped({
          scope: "hub",
          lane: "list",
          listFilter: "movers_24h",
          take: 24,
          staticFallback: false,
        })
      : Promise.resolve([] as HubMarketsPreviewPayload["movers24h"]),
  ]);

  const hotTopics = pickCrossLaneHotMarkets(
    [trendingList, trendingTape, trendingActivity, trendingHot, trendingNew],
    10,
  );

  return {
    breaking,
    movers24h,
    trendingList,
    trendingTape,
    trendingActivity,
    trendingHot,
    trendingNew,
    hotTopics,
  };
}
