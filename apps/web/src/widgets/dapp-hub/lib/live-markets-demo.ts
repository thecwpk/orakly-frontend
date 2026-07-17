import type { LiveMarketCardDto } from "@/shared/contracts/live-markets";
import type { LiveMarketsSort } from "@/shared/contracts/live-markets";

function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 86_400_000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

type FallbackMarket = LiveMarketCardDto & {
  trendingScore: number;
  createdAt: string;
};

/**
 * Seed-aligned fallback desk when `/api/v1/markets` is empty or unavailable.
 * Slugs match packages/database/prisma/seed.ts so detail links resolve once the DB recovers.
 */
export const LIVE_MARKETS_DEMO: readonly FallbackMarket[] = [
  {
    id: "nvidia-5trillion-mcap-2026",
    slug: "nvidia-5trillion-mcap-2026",
    title: "NVDA market cap exceeds $5T intraday before 2027?",
    category: "macro",
    narrative: "AI",
    creatorAddress: "0x81a4c2f9d0e7b36a991234567890abcdef01",
    volumeUsd: 6_100_000,
    liquidityUsd: 1_400_000,
    probability: 0.42,
    closesAt: "2026-12-31T23:00:00.000Z",
    status: "OPEN",
    participants: 512,
    trendingScore: 11020,
    createdAt: daysAgo(88),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "btc-ath-q3-2026",
    slug: "btc-ath-q3-2026",
    title: "BTC to hit a new all-time high in Q3 2026?",
    category: "market-sentiment",
    narrative: "Crypto",
    creatorAddress: "0xb2c81f0044aa99112233445566778899aabb",
    volumeUsd: 9_800_000,
    liquidityUsd: 2_100_000,
    probability: 0.47,
    closesAt: "2026-09-30T23:00:00.000Z",
    status: "OPEN",
    participants: 840,
    trendingScore: 10540,
    createdAt: daysAgo(120),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "new-stablecoin-act-us-2026",
    slug: "new-stablecoin-act-us-2026",
    title: "US passes federal stablecoin market-structure legislation in 2026?",
    category: "politics",
    narrative: "Macro",
    creatorAddress: "0x4f9e22aa00bbccddeeff001122334455667700aa",
    volumeUsd: 1_920_000,
    liquidityUsd: 480_000,
    probability: 0.36,
    closesAt: "2026-12-31T23:00:00.000Z",
    status: "OPEN",
    participants: 298,
    trendingScore: 9795,
    createdAt: daysAgo(11),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "solana-etf-2026",
    slug: "solana-etf-2026",
    title: "Solana spot ETF approved in the US by end of 2026?",
    category: "ecosystems",
    narrative: "Solana",
    creatorAddress: "0x99aa11bb22cc33dd44ee55ff6677889900112233",
    volumeUsd: 2_400_000,
    liquidityUsd: 610_000,
    probability: 0.38,
    closesAt: "2026-12-31T23:00:00.000Z",
    status: "OPEN",
    participants: 356,
    trendingScore: 9650,
    createdAt: daysAgo(14),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "uefa-champs-real-madrid-2027",
    slug: "uefa-champs-real-madrid-2027",
    title: "Real Madrid wins the UEFA Champions League in the 2026-27 season?",
    category: "sports",
    narrative: "Sports",
    creatorAddress: "0xa1b2c3d4e5f60718293a4b5c6d7e8f901234abcd",
    volumeUsd: 5_600_000,
    liquidityUsd: 910_000,
    probability: 0.14,
    closesAt: "2027-06-30T23:00:00.000Z",
    status: "OPEN",
    participants: 620,
    trendingScore: 9340,
    createdAt: daysAgo(70),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "fed-rate-cut-july-2026",
    slug: "fed-rate-cut-july-2026",
    title: "Will the Fed cut rates before July 2026?",
    category: "macro",
    narrative: "Macro",
    creatorAddress: "0x55aa66bb77cc88dd99ee00ff1122334455667788",
    volumeUsd: 4_200_000,
    liquidityUsd: 980_000,
    probability: 0.61,
    closesAt: "2026-07-15T23:00:00.000Z",
    status: "OPEN",
    participants: 410,
    trendingScore: 9120,
    createdAt: daysAgo(45),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "eth-flip-btc-2027",
    slug: "eth-flip-btc-2027",
    title: "Will ETH market cap exceed BTC before 2027?",
    category: "crypto",
    narrative: "Ethereum",
    creatorAddress: "0x778899aabbccddeeff0011223344556677889900",
    volumeUsd: 3_100_000,
    liquidityUsd: 720_000,
    probability: 0.22,
    closesAt: "2026-12-31T23:00:00.000Z",
    status: "OPEN",
    participants: 275,
    trendingScore: 8840,
    createdAt: daysAgo(60),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "openai-ipo-2027",
    slug: "openai-ipo-2027",
    title: "OpenAI completes an IPO before 2028?",
    category: "industry-events",
    narrative: "AI",
    creatorAddress: "0x112233445566778899aabbccddeeff0011223344",
    volumeUsd: 22_000_000,
    liquidityUsd: 4_200_000,
    probability: 0.19,
    closesAt: "2027-12-31T23:00:00.000Z",
    status: "OPEN",
    participants: 910,
    trendingScore: 8620,
    createdAt: daysAgo(180),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "gpt5-pass-bar-exam",
    slug: "gpt5-pass-bar-exam",
    title: "Will a top LLM pass a bar-exam style benchmark at ≥90% before 2027?",
    category: "crypto-narratives",
    narrative: "AI",
    creatorAddress: "0xabcdef0123456789abcdef0123456789abcdef01",
    volumeUsd: 560_000,
    liquidityUsd: 180_000,
    probability: 0.72,
    closesAt: "2026-12-01T23:00:00.000Z",
    status: "OPEN",
    participants: 188,
    trendingScore: 8310,
    createdAt: daysAgo(21),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "dogecoin-etf-2027",
    slug: "dogecoin-etf-2027",
    title: "Dogecoin-linked ETF listed on a major US exchange before 2028?",
    category: "crypto",
    narrative: "Memes",
    creatorAddress: "0x99887766554433221100ffeeddccbbaa99887766",
    volumeUsd: 480_000,
    liquidityUsd: 140_000,
    probability: 0.11,
    closesAt: daysFromNow(400),
    status: "OPEN",
    participants: 156,
    trendingScore: 7980,
    createdAt: daysAgo(9),
    onChainAddress: null,
    chainId: 97,
  },
] as const;

export function sortLiveMarketsForTab<
  T extends {
    volumeUsd: number;
    closesAt: string;
    trendingScore?: number;
    createdAt?: string;
    id: string;
  },
>(markets: readonly T[], tab: LiveMarketsSort): T[] {
  const next = [...markets];
  switch (tab) {
    case "volume":
      return next.sort((a, b) => b.volumeUsd - a.volumeUsd);
    case "newest":
      return next.sort((a, b) => {
        const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bT - aT;
      });
    case "ending":
      return next.sort(
        (a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime(),
      );
    case "trending":
    default:
      return next.sort(
        (a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0) || b.volumeUsd - a.volumeUsd,
      );
  }
}

export function getDemoLiveMarkets(tab: LiveMarketsSort, limit = 6): LiveMarketCardDto[] {
  return sortLiveMarketsForTab(LIVE_MARKETS_DEMO, tab)
    .slice(0, limit)
    .map(({ trendingScore: _t, createdAt: _c, ...rest }) => rest);
}

/** Explorer-shaped fallback when the markets list API is unavailable. */
export function getFallbackExplorerMarkets(limit = 20): LiveMarketCardDto[] {
  return sortLiveMarketsForTab(LIVE_MARKETS_DEMO, "trending")
    .slice(0, limit)
    .map(({ trendingScore: _t, createdAt: _c, ...rest }) => rest);
}
