import type { Market } from "@orakly/types";

const featuredMarkets: Market[] = [
  {
    id: "fed-rate-cut-june",
    slug: "fed-rate-cut-june",
    title: "Will the Fed cut rates before July?",
    category: "Macro",
    volumeUsd: 2_420_000,
    liquidityUsd: 940_000,
    probability: 0.61,
    closesAt: "2026-06-29T23:00:00.000Z",
    status: "OPEN",
  },
  {
    id: "btc-ath-q3",
    slug: "btc-ath-q3",
    title: "BTC to hit a new all-time high in Q3?",
    category: "Crypto",
    volumeUsd: 5_810_000,
    liquidityUsd: 2_400_000,
    probability: 0.47,
    closesAt: "2026-09-30T23:00:00.000Z",
    status: "OPEN",
  },
  {
    id: "election-turnout-2028",
    slug: "election-turnout-2028",
    title: "US turnout above 64% in 2028 election?",
    category: "Politics",
    volumeUsd: 1_110_000,
    liquidityUsd: 510_000,
    probability: 0.52,
    closesAt: "2028-11-07T23:00:00.000Z",
    status: "OPEN",
  },
];

export async function getFeaturedMarkets(): Promise<Market[]> {
  return featuredMarkets;
}
