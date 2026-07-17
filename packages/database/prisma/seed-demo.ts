/**
 * Demo seed for /dapp hub — real DB rows so APIs return populated (non-mock) data.
 *
 * Idempotent: re-run safely via unique slugs / wallets / externalRefs.
 *
 * Run from repo root:
 *   npm run seed:demo
 * Or:
 *   npm run seed:demo --workspace=@orakly/database
 *
 * Requires DATABASE_URL (packages/database/.env).
 */
import "dotenv/config";
import {
  ActivityType,
  MarketStatus,
  MarketSuggestionStatus,
  NarrativeTrend,
  OutcomeSide,
  Prisma,
} from "@prisma/client";
import { prisma } from "../src/client";

const DEMO_PREFIX = "demo-";
const DEMO_EXTERNAL = "demo:";

const CATEGORIES: readonly { slug: string; name: string }[] = [
  { slug: "tech", name: "Tech" },
  { slug: "meme-coins", name: "Meme Coins" },
  { slug: "ecosystems", name: "Ecosystems" },
  { slug: "crypto", name: "Crypto" },
  { slug: "crypto-narratives", name: "Crypto Narratives" },
];

/** Narrative lanes used by Trending Narratives + Market Pulse. */
const ATTENTION: readonly {
  narrative: string;
  slug: string;
  name: string;
  score: number;
  prev: number;
  conviction: number;
  momentum: "Growing" | "Cooling" | "Stable";
  trend: NarrativeTrend;
  volume24hUsd: number;
  activeMarkets: number;
  uniqueTraders: number;
  liquidity: number;
  openInterest: number;
}[] = [
  {
    narrative: "AI",
    slug: "ai",
    name: "AI",
    score: 78,
    prev: 64,
    conviction: 71,
    momentum: "Growing",
    trend: NarrativeTrend.RISING,
    volume24hUsd: 2_450_000,
    activeMarkets: 5,
    uniqueTraders: 420,
    liquidity: 920_000,
    openInterest: 1_850_000,
  },
  {
    narrative: "Memes",
    slug: "memes",
    name: "Memes",
    score: 61,
    prev: 69,
    conviction: 48,
    momentum: "Cooling",
    trend: NarrativeTrend.COOLING,
    volume24hUsd: 1_680_000,
    activeMarkets: 4,
    uniqueTraders: 510,
    liquidity: 510_000,
    openInterest: 980_000,
  },
  {
    narrative: "BNB",
    slug: "bnb",
    name: "BNB",
    score: 67,
    prev: 55,
    conviction: 63,
    momentum: "Growing",
    trend: NarrativeTrend.RISING,
    volume24hUsd: 1_420_000,
    activeMarkets: 4,
    uniqueTraders: 310,
    liquidity: 740_000,
    openInterest: 1_150_000,
  },
  {
    narrative: "DeFi",
    slug: "defi",
    name: "DeFi",
    score: 54,
    prev: 52,
    conviction: 57,
    momentum: "Stable",
    trend: NarrativeTrend.STABLE,
    volume24hUsd: 1_050_000,
    activeMarkets: 4,
    uniqueTraders: 265,
    liquidity: 680_000,
    openInterest: 920_000,
  },
  {
    narrative: "Base",
    slug: "base",
    name: "Base",
    score: 59,
    prev: 50,
    conviction: 55,
    momentum: "Growing",
    trend: NarrativeTrend.RISING,
    volume24hUsd: 640_000,
    activeMarkets: 3,
    uniqueTraders: 176,
    liquidity: 420_000,
    openInterest: 710_000,
  },
  {
    narrative: "Solana",
    slug: "solana",
    name: "Solana",
    score: 56,
    prev: 58,
    conviction: 52,
    momentum: "Cooling",
    trend: NarrativeTrend.COOLING,
    volume24hUsd: 720_000,
    activeMarkets: 3,
    uniqueTraders: 220,
    liquidity: 490_000,
    openInterest: 830_000,
  },
  {
    narrative: "RWA",
    slug: "rwa",
    name: "RWA",
    score: 48,
    prev: 41,
    conviction: 46,
    momentum: "Growing",
    trend: NarrativeTrend.RISING,
    volume24hUsd: 310_000,
    activeMarkets: 2,
    uniqueTraders: 94,
    liquidity: 280_000,
    openInterest: 390_000,
  },
  {
    narrative: "Gaming",
    slug: "gaming",
    name: "Gaming",
    score: 44,
    prev: 49,
    conviction: 40,
    momentum: "Cooling",
    trend: NarrativeTrend.COOLING,
    volume24hUsd: 280_000,
    activeMarkets: 2,
    uniqueTraders: 112,
    liquidity: 210_000,
    openInterest: 320_000,
  },
];

type DemoMarket = {
  slug: string;
  title: string;
  categorySlug: string;
  narrative: string;
  yesPrice: number;
  volumeTotalUsd: number;
  volume24hUsd: number;
  liquidityUsd: number;
  collateralPoolUsd: number;
  trendingScore: number;
  createdDaysAgo: number;
  /** Hours from now until close (positive = future). Some < 48h for MARKET_CLOSING. */
  closesInHours: number;
  creatorIndex: number;
  creatorRewardPercent: number;
};

const MARKETS: readonly DemoMarket[] = [
  // AI (5)
  {
    slug: `${DEMO_PREFIX}ai-gpt5-q4`,
    title: "Will GPT-5 launch before end of Q4 2026?",
    categorySlug: "tech",
    narrative: "AI",
    yesPrice: 0.58,
    volumeTotalUsd: 2_400_000,
    volume24hUsd: 412_000,
    liquidityUsd: 680_000,
    collateralPoolUsd: 420_000,
    trendingScore: 9800,
    createdDaysAgo: 12,
    closesInHours: 72 * 24,
    creatorIndex: 0,
    creatorRewardPercent: 5,
  },
  {
    slug: `${DEMO_PREFIX}ai-nvda-3t`,
    title: "Will NVIDIA market cap exceed $4T by Dec 2026?",
    categorySlug: "tech",
    narrative: "AI",
    yesPrice: 0.41,
    volumeTotalUsd: 1_900_000,
    volume24hUsd: 355_000,
    liquidityUsd: 540_000,
    collateralPoolUsd: 310_000,
    trendingScore: 9200,
    createdDaysAgo: 8,
    closesInHours: 120 * 24,
    creatorIndex: 0,
    creatorRewardPercent: 5,
  },
  {
    slug: `${DEMO_PREFIX}ai-agents-tvl`,
    title: "Will AI agent protocols surpass $2B TVL in 2026?",
    categorySlug: "tech",
    narrative: "AI",
    yesPrice: 0.36,
    volumeTotalUsd: 980_000,
    volume24hUsd: 188_000,
    liquidityUsd: 290_000,
    collateralPoolUsd: 175_000,
    trendingScore: 8600,
    createdDaysAgo: 5,
    closesInHours: 36,
    creatorIndex: 1,
    creatorRewardPercent: 6,
  },
  {
    slug: `${DEMO_PREFIX}ai-taobot`,
    title: "Will TAO flip FIL by market cap this year?",
    categorySlug: "tech",
    narrative: "AI",
    yesPrice: 0.62,
    volumeTotalUsd: 720_000,
    volume24hUsd: 142_000,
    liquidityUsd: 210_000,
    collateralPoolUsd: 130_000,
    trendingScore: 8100,
    createdDaysAgo: 3,
    closesInHours: 90 * 24,
    creatorIndex: 1,
    creatorRewardPercent: 5,
  },
  {
    slug: `${DEMO_PREFIX}ai-openai-ipo`,
    title: "OpenAI IPO announced before mid-2027?",
    categorySlug: "tech",
    narrative: "AI",
    yesPrice: 0.29,
    volumeTotalUsd: 1_150_000,
    volume24hUsd: 210_000,
    liquidityUsd: 360_000,
    collateralPoolUsd: 200_000,
    trendingScore: 7900,
    createdDaysAgo: 18,
    closesInHours: 200 * 24,
    creatorIndex: 2,
    creatorRewardPercent: 4,
  },
  // Memes (4)
  {
    slug: `${DEMO_PREFIX}memes-doge-50b`,
    title: "Will DOGE market cap exceed $50B by Dec 2026?",
    categorySlug: "meme-coins",
    narrative: "Memes",
    yesPrice: 0.33,
    volumeTotalUsd: 3_100_000,
    volume24hUsd: 520_000,
    liquidityUsd: 410_000,
    collateralPoolUsd: 280_000,
    trendingScore: 9400,
    createdDaysAgo: 10,
    closesInHours: 100 * 24,
    creatorIndex: 3,
    creatorRewardPercent: 7,
  },
  {
    slug: `${DEMO_PREFIX}memes-pepe-ath`,
    title: "PEPE hits a new all-time high in 2026?",
    categorySlug: "meme-coins",
    narrative: "Memes",
    yesPrice: 0.47,
    volumeTotalUsd: 1_650_000,
    volume24hUsd: 298_000,
    liquidityUsd: 320_000,
    collateralPoolUsd: 190_000,
    trendingScore: 8800,
    createdDaysAgo: 6,
    closesInHours: 40,
    creatorIndex: 3,
    creatorRewardPercent: 6,
  },
  {
    slug: `${DEMO_PREFIX}memes-wownero`,
    title: "Will a new meme coin enter top-20 CMC this quarter?",
    categorySlug: "meme-coins",
    narrative: "Memes",
    yesPrice: 0.55,
    volumeTotalUsd: 890_000,
    volume24hUsd: 175_000,
    liquidityUsd: 180_000,
    collateralPoolUsd: 95_000,
    trendingScore: 7700,
    createdDaysAgo: 2,
    closesInHours: 45 * 24,
    creatorIndex: 4,
    creatorRewardPercent: 5,
  },
  {
    slug: `${DEMO_PREFIX}memes-bnb-memecoins`,
    title: "BNB-chain meme volume beats Solana memes this month?",
    categorySlug: "meme-coins",
    narrative: "Memes",
    yesPrice: 0.44,
    volumeTotalUsd: 1_020_000,
    volume24hUsd: 205_000,
    liquidityUsd: 240_000,
    collateralPoolUsd: 140_000,
    trendingScore: 8300,
    createdDaysAgo: 4,
    closesInHours: 28 * 24,
    creatorIndex: 4,
    creatorRewardPercent: 5,
  },
  // BNB (4)
  {
    slug: `${DEMO_PREFIX}bnb-price-800`,
    title: "Will BNB trade above $800 before Sep 2026?",
    categorySlug: "ecosystems",
    narrative: "BNB",
    yesPrice: 0.52,
    volumeTotalUsd: 2_200_000,
    volume24hUsd: 390_000,
    liquidityUsd: 560_000,
    collateralPoolUsd: 340_000,
    trendingScore: 9100,
    createdDaysAgo: 9,
    closesInHours: 60 * 24,
    creatorIndex: 5,
    creatorRewardPercent: 5,
  },
  {
    slug: `${DEMO_PREFIX}bnb-opbnb-tvl`,
    title: "opBNB TVL exceeds $1B by end of 2026?",
    categorySlug: "ecosystems",
    narrative: "BNB",
    yesPrice: 0.38,
    volumeTotalUsd: 780_000,
    volume24hUsd: 125_000,
    liquidityUsd: 220_000,
    collateralPoolUsd: 110_000,
    trendingScore: 7400,
    createdDaysAgo: 14,
    closesInHours: 150 * 24,
    creatorIndex: 5,
    creatorRewardPercent: 5,
  },
  {
    slug: `${DEMO_PREFIX}bnb-cz-speech`,
    title: "CZ keynotes a major crypto conference in 2026?",
    categorySlug: "ecosystems",
    narrative: "BNB",
    yesPrice: 0.71,
    volumeTotalUsd: 640_000,
    volume24hUsd: 98_000,
    liquidityUsd: 160_000,
    collateralPoolUsd: 85_000,
    trendingScore: 7000,
    createdDaysAgo: 1,
    closesInHours: 20,
    creatorIndex: 6,
    creatorRewardPercent: 4,
  },
  {
    slug: `${DEMO_PREFIX}bnb-dex-volume`,
    title: "PancakeSwap 30d volume tops Uniswap for a month in 2026?",
    categorySlug: "ecosystems",
    narrative: "BNB",
    yesPrice: 0.27,
    volumeTotalUsd: 1_310_000,
    volume24hUsd: 240_000,
    liquidityUsd: 380_000,
    collateralPoolUsd: 210_000,
    trendingScore: 8500,
    createdDaysAgo: 7,
    closesInHours: 80 * 24,
    creatorIndex: 6,
    creatorRewardPercent: 5,
  },
  // DeFi (5)
  {
    slug: `${DEMO_PREFIX}defi-eth-staking`,
    title: "Ethereum staking APR average above 4% this quarter?",
    categorySlug: "crypto",
    narrative: "DeFi",
    yesPrice: 0.49,
    volumeTotalUsd: 1_480_000,
    volume24hUsd: 265_000,
    liquidityUsd: 450_000,
    collateralPoolUsd: 260_000,
    trendingScore: 8700,
    createdDaysAgo: 11,
    closesInHours: 55 * 24,
    creatorIndex: 7,
    creatorRewardPercent: 5,
  },
  {
    slug: `${DEMO_PREFIX}defi-aave-tvl`,
    title: "Aave TVL back above $20B before 2027?",
    categorySlug: "crypto",
    narrative: "DeFi",
    yesPrice: 0.57,
    volumeTotalUsd: 1_050_000,
    volume24hUsd: 178_000,
    liquidityUsd: 310_000,
    collateralPoolUsd: 180_000,
    trendingScore: 8000,
    createdDaysAgo: 15,
    closesInHours: 110 * 24,
    creatorIndex: 7,
    creatorRewardPercent: 6,
  },
  {
    slug: `${DEMO_PREFIX}defi-restaking`,
    title: "Restaking protocols reach $25B TVL by year-end?",
    categorySlug: "crypto",
    narrative: "DeFi",
    yesPrice: 0.43,
    volumeTotalUsd: 920_000,
    volume24hUsd: 156_000,
    liquidityUsd: 270_000,
    collateralPoolUsd: 150_000,
    trendingScore: 7600,
    createdDaysAgo: 4,
    closesInHours: 24,
    creatorIndex: 2,
    creatorRewardPercent: 5,
  },
  {
    slug: `${DEMO_PREFIX}defi-stablecoins`,
    title: "USDC + USDT combined supply above $250B in 2026?",
    categorySlug: "crypto",
    narrative: "DeFi",
    yesPrice: 0.66,
    volumeTotalUsd: 2_050_000,
    volume24hUsd: 310_000,
    liquidityUsd: 520_000,
    collateralPoolUsd: 290_000,
    trendingScore: 8900,
    createdDaysAgo: 20,
    closesInHours: 130 * 24,
    creatorIndex: 1,
    creatorRewardPercent: 4,
  },
  {
    slug: `${DEMO_PREFIX}defi-perp-dex`,
    title: "A perp DEX exceeds $100B monthly volume this year?",
    categorySlug: "crypto",
    narrative: "DeFi",
    yesPrice: 0.51,
    volumeTotalUsd: 870_000,
    volume24hUsd: 134_000,
    liquidityUsd: 230_000,
    collateralPoolUsd: 120_000,
    trendingScore: 7200,
    createdDaysAgo: 0,
    closesInHours: 70 * 24,
    creatorIndex: 0,
    creatorRewardPercent: 5,
  },
];

/** Demo trader/creator wallets — enough unique addresses for realistic Active Traders. */
const DEMO_WALLET_COUNT = 96;

function demoWallet(index: number): string {
  // 40 hex chars after 0x — deterministic, lowercase.
  const n = (index + 1).toString(16).padStart(40, "0");
  return `0x${n}`;
}

const DEMO_WALLETS = Array.from({ length: DEMO_WALLET_COUNT }, (_, i) =>
  demoWallet(i),
);

const CREATOR_NAMES = [
  "NovaLabs",
  "AlphaForge",
  "PulseDesk",
  "MemeOracle",
  "ChainSeer",
  "BnbBuilder",
  "YieldScout",
  "RiskRanger",
];

function demoDisplayName(i: number): string {
  return CREATOR_NAMES[i] ?? `DemoTrader${String(i + 1).padStart(2, "0")}`;
}

const PENDING_SUGGESTIONS: readonly {
  title: string;
  category: string;
  narrative: string;
  voteCount: number;
  hoursAgo: number;
}[] = [
  {
    title: "[Demo] Will AI tokens outperform L1 beta this month?",
    category: "tech",
    narrative: "AI",
    voteCount: 48,
    hoursAgo: 2,
  },
  {
    title: "[Demo] BNB Greenfield storage deals exceed 10k?",
    category: "ecosystems",
    narrative: "BNB",
    voteCount: 36,
    hoursAgo: 5,
  },
  {
    title: "[Demo] Will DOGE flip ADA again in 2026?",
    category: "meme-coins",
    narrative: "Memes",
    voteCount: 62,
    hoursAgo: 8,
  },
  {
    title: "[Demo] EigenLayer AVS count above 50 by Q3?",
    category: "crypto",
    narrative: "DeFi",
    voteCount: 29,
    hoursAgo: 12,
  },
  {
    title: "[Demo] Base sequencer revenue > $50M this year?",
    category: "ecosystems",
    narrative: "Base",
    voteCount: 41,
    hoursAgo: 18,
  },
  {
    title: "[Demo] Solana daily fees beat Ethereum for a week?",
    category: "ecosystems",
    narrative: "Solana",
    voteCount: 55,
    hoursAgo: 22,
  },
  {
    title: "[Demo] BlackRock launches a tokenized T-bill on BNB?",
    category: "crypto",
    narrative: "RWA",
    voteCount: 33,
    hoursAgo: 30,
  },
  {
    title: "[Demo] Axie Infinity MAU back above 500k?",
    category: "crypto-narratives",
    narrative: "Gaming",
    voteCount: 19,
    hoursAgo: 40,
  },
  {
    title: "[Demo] Will Render token flip FET this quarter?",
    category: "tech",
    narrative: "AI",
    voteCount: 44,
    hoursAgo: 6,
  },
  {
    title: "[Demo] New BNB meme launches and hits $100M FDV in 48h?",
    category: "meme-coins",
    narrative: "Memes",
    voteCount: 71,
    hoursAgo: 1,
  },
  {
    title: "[Demo] Aave V4 ships mainnet before 2027?",
    category: "crypto",
    narrative: "DeFi",
    voteCount: 27,
    hoursAgo: 50,
  },
  {
    title: "[Demo] Will BTC ETF cumulative inflows exceed $100B?",
    category: "crypto",
    narrative: "DeFi",
    voteCount: 58,
    hoursAgo: 15,
  },
  {
    title: "[Demo] CZ tweets about Orakly before mainnet?",
    category: "ecosystems",
    narrative: "BNB",
    voteCount: 15,
    hoursAgo: 3,
  },
];

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3_600_000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 86_400_000);
}

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 3_600_000);
}

async function ensureCategories(): Promise<Map<string, string>> {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name },
      update: { name: c.name },
    });
  }
  const rows = await prisma.category.findMany({
    where: { slug: { in: CATEGORIES.map((c) => c.slug) } },
  });
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function ensureUsers(): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < DEMO_WALLETS.length; i++) {
    const walletAddress = DEMO_WALLETS[i]!;
    const user = await prisma.user.upsert({
      where: { walletAddress },
      create: {
        walletAddress,
        displayName: demoDisplayName(i),
      },
      update: {
        displayName: demoDisplayName(i),
      },
    });
    ids.push(user.id);
  }
  return ids;
}

async function seedAttention(): Promise<void> {
  for (const row of ATTENTION) {
    await prisma.attentionScore.upsert({
      where: { narrative: row.narrative },
      create: {
        narrative: row.narrative,
        narrativeSlug: row.slug,
        narrativeName: row.name,
        score: new Prisma.Decimal(row.score),
        previousScore: new Prisma.Decimal(row.prev),
        scorePrev24h: row.prev,
        convictionScore: row.conviction,
        momentum: row.momentum,
        trend: row.trend,
        volume24hUsd: row.volume24hUsd,
        activeMarkets: row.activeMarkets,
        uniqueTraders: row.uniqueTraders,
        liquidity: row.liquidity,
        openInterest: row.openInterest,
        updatedAt: new Date(),
      },
      update: {
        narrativeSlug: row.slug,
        narrativeName: row.name,
        score: new Prisma.Decimal(row.score),
        previousScore: new Prisma.Decimal(row.prev),
        scorePrev24h: row.prev,
        convictionScore: row.conviction,
        momentum: row.momentum,
        trend: row.trend,
        volume24hUsd: row.volume24hUsd,
        activeMarkets: row.activeMarkets,
        uniqueTraders: row.uniqueTraders,
        liquidity: row.liquidity,
        openInterest: row.openInterest,
        updatedAt: new Date(),
      },
    });
  }
}

async function seedMarkets(
  catIds: Map<string, string>,
  userIds: string[],
): Promise<{ id: string; slug: string; title: string; narrative: string }[]> {
  const out: { id: string; slug: string; title: string; narrative: string }[] = [];

  for (const row of MARKETS) {
    const categoryId = catIds.get(row.categorySlug);
    if (!categoryId) throw new Error(`Missing category ${row.categorySlug}`);

    const creatorId = userIds[row.creatorIndex]!;
    const creatorAddress = DEMO_WALLETS[row.creatorIndex]!;
    const yes = row.yesPrice;
    const no = Math.round((1 - yes) * 1e9) / 1e9;
    const opensAt = daysAgo(row.createdDaysAgo + 2);
    const createdAt = daysAgo(row.createdDaysAgo);
    const closesAt = hoursFromNow(row.closesInHours);

    const market = await prisma.market.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        title: row.title,
        status: MarketStatus.OPEN,
        categoryId,
        creatorId,
        creatorAddress,
        creatorRewardPercent: row.creatorRewardPercent,
        narrative: row.narrative,
        momentum:
          row.narrative === "Memes" || row.narrative === "Solana"
            ? "Cooling"
            : row.narrative === "DeFi"
              ? "Stable"
              : "Growing",
        opensAt,
        closesAt,
        createdAt,
        yesPrice: new Prisma.Decimal(yes),
        noPrice: new Prisma.Decimal(no),
        probability: new Prisma.Decimal(yes),
        volumeTotalUsd: new Prisma.Decimal(row.volumeTotalUsd),
        volume24hUsd: new Prisma.Decimal(Math.round(row.volume24hUsd * 2.4)),
        liquidityUsd: new Prisma.Decimal(row.liquidityUsd),
        collateralPoolUsd: new Prisma.Decimal(
          Math.round(row.collateralPoolUsd * 1.8),
        ),
        trendingScore: new Prisma.Decimal(row.trendingScore),
        resolutionSource: "Demo seed — CoinGecko / official announcements at deadline",
        generationKey: `seed-demo:${row.slug}`,
      },
      update: {
        title: row.title,
        status: MarketStatus.OPEN,
        categoryId,
        creatorId,
        creatorAddress,
        creatorRewardPercent: row.creatorRewardPercent,
        narrative: row.narrative,
        closesAt,
        yesPrice: new Prisma.Decimal(yes),
        noPrice: new Prisma.Decimal(no),
        probability: new Prisma.Decimal(yes),
        volumeTotalUsd: new Prisma.Decimal(row.volumeTotalUsd),
        volume24hUsd: new Prisma.Decimal(Math.round(row.volume24hUsd * 2.4)),
        liquidityUsd: new Prisma.Decimal(row.liquidityUsd),
        collateralPoolUsd: new Prisma.Decimal(
          Math.round(row.collateralPoolUsd * 1.8),
        ),
        trendingScore: new Prisma.Decimal(row.trendingScore),
        resolutionSource: "Demo seed — CoinGecko / official announcements at deadline",
        generationKey: `seed-demo:${row.slug}`,
      },
    });

    out.push({
      id: market.id,
      slug: market.slug,
      title: market.title,
      narrative: row.narrative,
    });
  }

  return out;
}

async function clearDemoTradesAndActivities(): Promise<void> {
  await prisma.activity.deleteMany({
    where: {
      OR: [
        { title: { startsWith: "[Demo]" } },
        {
          trade: {
            externalRef: { startsWith: DEMO_EXTERNAL },
          },
        },
      ],
    },
  });
  await prisma.trade.deleteMany({
    where: { externalRef: { startsWith: DEMO_EXTERNAL } },
  });
  // Demo positions live only on demo markets / resolved demo markets.
  await prisma.position.deleteMany({
    where: {
      market: {
        OR: [
          { slug: { startsWith: DEMO_PREFIX } },
          { generationKey: { startsWith: "seed-demo:" } },
        ],
      },
    },
  });
}

async function ensurePortfolio(
  userId: string,
  realizedPnlUsd: number,
): Promise<string> {
  const row = await prisma.portfolio.upsert({
    where: { userId },
    create: {
      userId,
      realizedPnlUsd: new Prisma.Decimal(realizedPnlUsd.toFixed(2)),
      lastMarkUsd: new Prisma.Decimal(Math.max(0, realizedPnlUsd * 0.35).toFixed(2)),
      lastMarkedAt: new Date(),
    },
    update: {
      realizedPnlUsd: new Prisma.Decimal(realizedPnlUsd.toFixed(2)),
      lastMarkUsd: new Prisma.Decimal(Math.max(0, realizedPnlUsd * 0.35).toFixed(2)),
      lastMarkedAt: new Date(),
    },
  });
  return row.id;
}

async function seedTradesAndActivities(
  markets: { id: string; slug: string; title: string; narrative: string }[],
  userIds: string[],
): Promise<void> {
  await clearDemoTradesAndActivities();

  // ~4 trades per wallet over the last 18h → Active Traders ≈ wallet count.
  const tradeCount = Math.max(userIds.length * 4, 360);
  const tradeRows: Prisma.TradeCreateManyInput[] = [];
  const activityRows: Prisma.ActivityCreateManyInput[] = [];

  for (let i = 0; i < tradeCount; i++) {
    const market = markets[i % markets.length]!;
    const buyerIdx = i % userIds.length;
    let sellerIdx = (i * 7 + 11) % userIds.length;
    if (sellerIdx === buyerIdx) sellerIdx = (sellerIdx + 1) % userIds.length;
    const buyerId = userIds[buyerIdx]!;
    const sellerId = userIds[sellerIdx]!;
    const outcome = i % 3 === 0 ? OutcomeSide.NO : OutcomeSide.YES;
    const price = 0.22 + (i % 14) * 0.04;
    const quantity = 40 + (i % 25) * 12;
    const notional = Number((price * quantity).toFixed(2));
    const executedAt = hoursAgo((i / tradeCount) * 18 + 0.05);
    const externalRef = `${DEMO_EXTERNAL}trade:${i + 1}`;

    tradeRows.push({
      marketId: market.id,
      outcome,
      price: new Prisma.Decimal(price.toFixed(9)),
      quantity: new Prisma.Decimal(quantity),
      notionalUsd: new Prisma.Decimal(notional),
      buyerId,
      sellerId,
      takerId: buyerId,
      makerId: sellerId,
      externalRef,
      executedAt,
      feeBuyerUsd: new Prisma.Decimal((notional * 0.0025).toFixed(4)),
      feeSellerUsd: new Prisma.Decimal(0),
    });

    if (i % 12 === 0) {
      activityRows.push({
        type: ActivityType.TRADE,
        userId: buyerId,
        marketId: market.id,
        title: `[Demo] Trade on ${market.title.slice(0, 48)}`,
        payload: {
          source: "seed-demo",
          question: market.title,
          outcome,
          notionalUsd: notional,
        },
        createdAt: executedAt,
      });
    }
  }

  const BATCH = 80;
  for (let i = 0; i < tradeRows.length; i += BATCH) {
    await prisma.trade.createMany({
      data: tradeRows.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }
  if (activityRows.length > 0) {
    await prisma.activity.createMany({ data: activityRows });
  }

  // Portfolios + open positions (OI + Portfolio desk + leaderboard PnL).
  const portfolioIds: string[] = [];
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i]!;
    const pnl =
      i < 8
        ? 420 + i * 95
        : i < 32
          ? 80 + (i % 12) * 18
          : 12 + (i % 9) * 7;
    portfolioIds.push(await ensurePortfolio(userId, pnl));
  }

  const positionRows: Prisma.PositionCreateManyInput[] = [];
  for (let i = 0; i < userIds.length; i++) {
    const portfolioId = portfolioIds[i]!;
    const openMarkets = 2 + (i % 3);
    for (let p = 0; p < openMarkets; p++) {
      const market = markets[(i + p * 5) % markets.length]!;
      const side = (i + p) % 2 === 0 ? OutcomeSide.YES : OutcomeSide.NO;
      const qty = 25 + ((i * 3 + p * 11) % 80);
      const entry = 0.35 + ((i + p) % 8) * 0.05;
      positionRows.push({
        portfolioId,
        marketId: market.id,
        side,
        quantity: new Prisma.Decimal(qty),
        avgEntryPrice: new Prisma.Decimal(entry.toFixed(9)),
      });
    }
  }
  for (let i = 0; i < positionRows.length; i += BATCH) {
    await prisma.position.createMany({
      data: positionRows.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }

  // Market creations (half organic, half community-approved style)
  const createActs: Prisma.ActivityCreateManyInput[] = [];
  for (let i = 0; i < 8; i++) {
    const market = markets[i]!;
    const creatorId = userIds[i % userIds.length]!;
    const community = i % 2 === 0;
    createActs.push({
      type: ActivityType.MARKET_CREATED,
      userId: creatorId,
      marketId: market.id,
      title: `[Demo] ${community ? "Approved" : "Created"} ${market.slug}`,
      payload: {
        source: community ? "community" : "seed-demo",
        kind: community ? "approved" : "created",
        question: market.title,
      },
      createdAt: hoursAgo(30 + i * 4),
    });
  }
  for (let i = 0; i < 4; i++) {
    const market = markets[8 + i];
    if (!market) continue;
    createActs.push({
      type: ActivityType.ADMIN_ACTION,
      userId: userIds[0]!,
      marketId: market.id,
      title: `[Demo] Approved ${market.slug}`,
      payload: {
        source: "seed-demo",
        kind: "approved",
        action: "approve",
        question: market.title,
      },
      createdAt: hoursAgo(8 + i * 3),
    });
  }
  if (createActs.length > 0) {
    await prisma.activity.createMany({ data: createActs });
  }
}

/**
 * Resolved demo markets + winning/losing positions so Leaderboard Accuracy / Profit
 * aren't stuck at 0%.
 */
async function seedResolvedDemoMarkets(
  catIds: Map<string, string>,
  userIds: string[],
): Promise<void> {
  const techId = catIds.get("tech");
  const cryptoId = catIds.get("crypto");
  if (!techId || !cryptoId) return;

  const resolved: {
    slug: string;
    title: string;
    narrative: string;
    categoryId: string;
    outcome: OutcomeSide;
    yesPrice: number;
  }[] = [
    {
      slug: `${DEMO_PREFIX}resolved-ai-gpu-shortage`,
      title: "[Demo Resolved] GPU shortage ends before June 2026?",
      narrative: "AI",
      categoryId: techId,
      outcome: OutcomeSide.NO,
      yesPrice: 0.22,
    },
    {
      slug: `${DEMO_PREFIX}resolved-btc-ath-q1`,
      title: "[Demo Resolved] BTC sets a new ATH in Q1 2026?",
      narrative: "DeFi",
      categoryId: cryptoId,
      outcome: OutcomeSide.YES,
      yesPrice: 0.71,
    },
    {
      slug: `${DEMO_PREFIX}resolved-meme-season`,
      title: "[Demo Resolved] Meme season tops before March 2026?",
      narrative: "Memes",
      categoryId: catIds.get("meme-coins") ?? cryptoId,
      outcome: OutcomeSide.YES,
      yesPrice: 0.58,
    },
    {
      slug: `${DEMO_PREFIX}resolved-bnb-etf`,
      title: "[Demo Resolved] Spot BNB ETF filed in the US by May 2026?",
      narrative: "BNB",
      categoryId: catIds.get("ecosystems") ?? cryptoId,
      outcome: OutcomeSide.NO,
      yesPrice: 0.31,
    },
  ];

  for (let i = 0; i < resolved.length; i++) {
    const row = resolved[i]!;
    const creatorId = userIds[i % Math.min(8, userIds.length)]!;
    const yes = row.yesPrice;
    const no = Math.round((1 - yes) * 1e9) / 1e9;
    const market = await prisma.market.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        title: row.title,
        status: MarketStatus.RESOLVED,
        categoryId: row.categoryId,
        creatorId,
        creatorAddress: DEMO_WALLETS[i % DEMO_WALLETS.length]!,
        creatorRewardPercent: 5,
        narrative: row.narrative,
        momentum: "Stable",
        opensAt: daysAgo(90),
        closesAt: daysAgo(3),
        createdAt: daysAgo(95),
        resolvedAt: daysAgo(2),
        resolvedOutcome: row.outcome,
        yesPrice: new Prisma.Decimal(yes),
        noPrice: new Prisma.Decimal(no),
        probability: new Prisma.Decimal(row.outcome === OutcomeSide.YES ? 1 : 0),
        volumeTotalUsd: new Prisma.Decimal(850_000 + i * 120_000),
        volume24hUsd: new Prisma.Decimal(0),
        liquidityUsd: new Prisma.Decimal(0),
        collateralPoolUsd: new Prisma.Decimal(0),
        trendingScore: new Prisma.Decimal(10),
        resolutionSource: "Demo seed resolution",
        generationKey: `seed-demo:${row.slug}`,
      },
      update: {
        status: MarketStatus.RESOLVED,
        resolvedAt: daysAgo(2),
        resolvedOutcome: row.outcome,
        volume24hUsd: new Prisma.Decimal(0),
        title: row.title,
        narrative: row.narrative,
      },
    });

    // ~24 wallets hold a side on each resolved market (mix of winners/losers).
    for (let u = 0; u < 24; u++) {
      const userIdx = (i * 13 + u * 3) % userIds.length;
      const userId = userIds[userIdx]!;
      const portfolioId = await ensurePortfolio(
        userId,
        40 + userIdx * 3 + (u % 5) * 11,
      );
      const side =
        u % 3 === 0
          ? row.outcome === OutcomeSide.YES
            ? OutcomeSide.NO
            : OutcomeSide.YES
          : row.outcome;
      await prisma.position.upsert({
        where: {
          portfolioId_marketId_side: {
            portfolioId,
            marketId: market.id,
            side,
          },
        },
        create: {
          portfolioId,
          marketId: market.id,
          side,
          quantity: new Prisma.Decimal(30 + u * 8),
          avgEntryPrice: new Prisma.Decimal((0.4 + (u % 5) * 0.08).toFixed(9)),
        },
        update: {
          quantity: new Prisma.Decimal(30 + u * 8),
          avgEntryPrice: new Prisma.Decimal((0.4 + (u % 5) * 0.08).toFixed(9)),
        },
      });
    }
  }
}

async function seedSuggestions(userIds: string[]): Promise<void> {
  for (let i = 0; i < PENDING_SUGGESTIONS.length; i++) {
    const row = PENDING_SUGGESTIONS[i]!;
    const submitterId = userIds[i % userIds.length]!;
    const voterWallets = DEMO_WALLETS.slice(0, Math.min(row.voteCount, DEMO_WALLETS.length));
    const updatedAt = hoursAgo(row.hoursAgo);

    const existing = await prisma.marketSuggestion.findFirst({
      where: { title: row.title },
      select: { id: true },
    });

    if (existing) {
      await prisma.marketSuggestion.update({
        where: { id: existing.id },
        data: {
          category: row.category,
          narrative: row.narrative,
          status: MarketSuggestionStatus.PENDING,
          voteCount: row.voteCount,
          votesUp: row.voteCount,
          voterAddresses: voterWallets,
          submitterId,
          updatedAt,
        },
      });
    } else {
      await prisma.marketSuggestion.create({
        data: {
          title: row.title,
          description: "Community demo suggestion seeded for /dapp Community Discovery.",
          category: row.category,
          narrative: row.narrative,
          status: MarketSuggestionStatus.PENDING,
          voteCount: row.voteCount,
          votesUp: row.voteCount,
          voterAddresses: voterWallets,
          submitterId,
          creatorRewardPercent: 5,
          createdAt: updatedAt,
          updatedAt,
        },
      });
    }
  }
}

async function main() {
  console.log("Seeding demo data for /dapp…");

  const catIds = await ensureCategories();
  const userIds = await ensureUsers();
  await seedAttention();
  const markets = await seedMarkets(catIds, userIds);
  await seedTradesAndActivities(markets, userIds);
  await seedResolvedDemoMarkets(catIds, userIds);
  await seedSuggestions(userIds);

  const [openCount, attentionCount, tradeCount, pendingCount, positionCount] =
    await Promise.all([
      prisma.market.count({
        where: { status: MarketStatus.OPEN, slug: { startsWith: DEMO_PREFIX } },
      }),
      prisma.attentionScore.count(),
      prisma.trade.count({ where: { externalRef: { startsWith: DEMO_EXTERNAL } } }),
      prisma.marketSuggestion.count({
        where: {
          status: MarketSuggestionStatus.PENDING,
          title: { startsWith: "[Demo]" },
        },
      }),
      prisma.position.count({
        where: { market: { slug: { startsWith: DEMO_PREFIX } } },
      }),
    ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        demoOpenMarkets: openCount,
        attentionNarratives: attentionCount,
        demoTrades: tradeCount,
        demoPositions: positionCount,
        pendingSuggestions: pendingCount,
        traders: DEMO_WALLETS.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
