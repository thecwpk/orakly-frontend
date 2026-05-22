import type { Market } from "@orakly/types";

/** Matches `GET /api/v1/markets/hub-preview` envelope body (`ok.data`). */
export type HubMarketsPreviewPayload = {
  breaking: Market[];
  movers24h: Market[];
  trendingList: Market[];
  trendingTape: Market[];
  trendingActivity: Market[];
  trendingHot: Market[];
  trendingNew: Market[];
  hotTopics: Market[];
};
