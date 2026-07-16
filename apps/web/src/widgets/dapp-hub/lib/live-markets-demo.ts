import type { LiveMarketCardDto } from "@/shared/contracts/live-markets";
import type { LiveMarketsSort } from "@/shared/contracts/live-markets";

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

type DemoMarket = LiveMarketCardDto & {
  trendingScore: number;
  createdAt: string;
};

/**
 * Swappable demo desk for Live Markets when `/api/v1/markets?sort=` is empty.
 * Scores diverge so each tab visibly re-orders the same set.
 */
export const LIVE_MARKETS_DEMO: readonly DemoMarket[] = [
  {
    id: "demo-live-ai-gpt",
    slug: "demo-ai-gpt5-q4",
    title: "Will GPT-5 launch before end of Q4 2026?",
    category: "tech",
    narrative: "AI",
    creatorAddress: "0xDem000000000000000000000000000000000001",
    volumeUsd: 2_400_000,
    liquidityUsd: 680_000,
    probability: 0.58,
    closesAt: hoursFromNow(72 * 24),
    status: "OPEN",
    participants: 412,
    trendingScore: 9800,
    createdAt: daysAgo(12),
    onChainAddress: "0x1111111111111111111111111111111111111111",
    chainId: 97,
  },
  {
    id: "demo-live-memes-doge",
    slug: "demo-memes-doge-50b",
    title: "Will DOGE market cap exceed $50B by Dec 2026?",
    category: "meme-coins",
    narrative: "Memes",
    creatorAddress: "0xDem000000000000000000000000000000000004",
    volumeUsd: 3_100_000,
    liquidityUsd: 410_000,
    probability: 0.33,
    closesAt: hoursFromNow(18),
    status: "OPEN",
    participants: 580,
    trendingScore: 9400,
    createdAt: daysAgo(10),
    onChainAddress: "0x2222222222222222222222222222222222222222",
    chainId: 97,
  },
  {
    id: "demo-live-bnb-800",
    slug: "demo-bnb-price-800",
    title: "Will BNB trade above $800 before Sep 2026?",
    category: "ecosystems",
    narrative: "BNB",
    creatorAddress: "0xDem000000000000000000000000000000000005",
    volumeUsd: 2_200_000,
    liquidityUsd: 560_000,
    probability: 0.52,
    closesAt: hoursFromNow(60 * 24),
    status: "OPEN",
    participants: 265,
    trendingScore: 9100,
    createdAt: daysAgo(9),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "demo-live-defi-aave",
    slug: "demo-defi-aave-tvl",
    title: "Aave TVL back above $20B before 2027?",
    category: "crypto",
    narrative: "DeFi",
    creatorAddress: "0xDem000000000000000000000000000000000007",
    volumeUsd: 1_050_000,
    liquidityUsd: 310_000,
    probability: 0.57,
    closesAt: hoursFromNow(110 * 24),
    status: "OPEN",
    participants: 198,
    trendingScore: 8000,
    createdAt: daysAgo(15),
    onChainAddress: "0x3333333333333333333333333333333333333333",
    chainId: 97,
  },
  {
    id: "demo-live-eth-staking",
    slug: "demo-defi-eth-staking",
    title: "Ethereum staking APR average above 4% this quarter?",
    category: "crypto",
    narrative: "DeFi",
    creatorAddress: "0xDem000000000000000000000000000000000007",
    volumeUsd: 1_480_000,
    liquidityUsd: 450_000,
    probability: 0.49,
    closesAt: hoursFromNow(36),
    status: "OPEN",
    participants: 301,
    trendingScore: 8700,
    createdAt: daysAgo(11),
    onChainAddress: "0x4444444444444444444444444444444444444444",
    chainId: 97,
  },
  {
    id: "demo-live-pepe",
    slug: "demo-memes-pepe-ath",
    title: "PEPE hits a new all-time high in 2026?",
    category: "meme-coins",
    narrative: "Memes",
    creatorAddress: "0xDem000000000000000000000000000000000003",
    volumeUsd: 1_650_000,
    liquidityUsd: 320_000,
    probability: 0.47,
    closesAt: hoursFromNow(40),
    status: "OPEN",
    participants: 440,
    trendingScore: 8800,
    createdAt: daysAgo(6),
    onChainAddress: "0x5555555555555555555555555555555555555555",
    chainId: 97,
  },
  {
    id: "demo-live-nvda",
    slug: "demo-ai-nvda-3t",
    title: "Will NVIDIA market cap exceed $4T by Dec 2026?",
    category: "tech",
    narrative: "AI",
    creatorAddress: "NovaLabs",
    volumeUsd: 1_900_000,
    liquidityUsd: 540_000,
    probability: 0.41,
    closesAt: hoursFromNow(120 * 24),
    status: "OPEN",
    participants: 356,
    trendingScore: 9200,
    createdAt: daysAgo(8),
    onChainAddress: "0x6666666666666666666666666666666666666666",
    chainId: 97,
  },
  {
    id: "demo-live-opbnb",
    slug: "demo-bnb-opbnb-tvl",
    title: "opBNB TVL exceeds $1B by end of 2026?",
    category: "ecosystems",
    narrative: "BNB",
    creatorAddress: "0xDem000000000000000000000000000000000006",
    volumeUsd: 780_000,
    liquidityUsd: 220_000,
    probability: 0.38,
    closesAt: hoursFromNow(12),
    status: "OPEN",
    participants: 142,
    trendingScore: 7400,
    createdAt: daysAgo(1),
    onChainAddress: null,
    chainId: 97,
  },
  {
    id: "demo-live-restake",
    slug: "demo-defi-restaking",
    title: "Restaking protocols reach $25B TVL by year-end?",
    category: "crypto",
    narrative: "DeFi",
    creatorAddress: "0xDem000000000000000000000000000000000002",
    volumeUsd: 920_000,
    liquidityUsd: 270_000,
    probability: 0.43,
    closesAt: hoursFromNow(24),
    status: "OPEN",
    participants: 187,
    trendingScore: 7600,
    createdAt: daysAgo(4),
    onChainAddress: "0x7777777777777777777777777777777777777777",
    chainId: 97,
  },
  {
    id: "demo-live-agents",
    slug: "demo-ai-agents-tvl",
    title: "Will AI agent protocols surpass $2B TVL in 2026?",
    category: "tech",
    narrative: "AI",
    creatorAddress: "PulseDesk",
    volumeUsd: 980_000,
    liquidityUsd: 290_000,
    probability: 0.36,
    closesAt: hoursFromNow(30),
    status: "OPEN",
    participants: 221,
    trendingScore: 8600,
    createdAt: daysAgo(0.5),
    onChainAddress: "0x8888888888888888888888888888888888888888",
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
