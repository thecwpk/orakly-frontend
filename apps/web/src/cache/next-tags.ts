/** Next.js `revalidateTag` / `updateTag` identifiers shared by Route Handlers & jobs. */
export const cacheTags = {
  cryptoFeed: "crypto-feed",
  marketsFeed: "markets-feed",
  attentionDashboard: "attention-dashboard",
  hubTopics: "hub-topics",
  marketDetail: (slug: string) => `market:${slug}`,
} as const;
