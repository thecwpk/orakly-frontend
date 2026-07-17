/**
 * Seeds OPEN markets + categories so hub lanes (`list/trending`, trending×volume/activity/hot/new)
 * return real DB rows — no static fallback on hub.
 *
 * Run from repo root:
 *   npm run db:seed --workspace=@orakly/database
 * Or:
 *   cd packages/database && npx prisma db seed
 *
 * Requires DATABASE_URL (see prisma.config.ts).
 */
import "dotenv/config";
import { MarketStatus, NarrativeTrend, Prisma } from "@prisma/client";
import { prisma } from "../src/client";

type SeedMarket = {
  slug: string;
  title: string;
  categorySlug: string;
  volumeTotalUsd: number;
  volume24hUsd: number;
  trendingScore: number;
  yesPrice: number;
  liquidityUsd: number;
  /** Older = appears lower on “new” lane unless compensated by id ordering — use small for freshest. */
  createdDaysAgo: number;
  closesAtIso: string;
};

const CATEGORIES: readonly { slug: string; name: string }[] = [
  { slug: "macro", name: "Macro" },
  { slug: "crypto", name: "Crypto" },
  { slug: "politics", name: "Politics" },
  { slug: "sports", name: "Sports" },
  { slug: "science", name: "Science" },
  { slug: "tech", name: "Tech" },
  { slug: "meme-coins", name: "Meme Coins" },
  { slug: "crypto-narratives", name: "Crypto Narratives" },
  { slug: "ecosystems", name: "Ecosystems" },
  { slug: "market-sentiment", name: "Market Sentiment" },
  { slug: "industry-events", name: "Industry Events" },
];

/** Curated so lifetime vs 24h vs trending vs createdAt diverge across hub sorts. */
const MARKETS: readonly SeedMarket[] = [
  {
    slug: "fed-rate-cut-july-2026",
    title: "Will the Fed cut rates before July 2026?",
    categorySlug: "macro",
    volumeTotalUsd: 4_200_000,
    volume24hUsd: 210_000,
    trendingScore: 9120,
    yesPrice: 0.61,
    liquidityUsd: 980_000,
    createdDaysAgo: 45,
    closesAtIso: "2026-07-15T23:00:00.000Z",
  },
  {
    slug: "btc-ath-q3-2026",
    title: "BTC to hit a new all-time high in Q3 2026?",
    categorySlug: "market-sentiment",
    volumeTotalUsd: 9_800_000,
    volume24hUsd: 1_420_000,
    trendingScore: 10540,
    yesPrice: 0.47,
    liquidityUsd: 2_100_000,
    createdDaysAgo: 120,
    closesAtIso: "2026-09-30T23:00:00.000Z",
  },
  {
    slug: "eth-flip-btc-2027",
    title: "Will ETH market cap exceed BTC before 2027?",
    categorySlug: "crypto",
    volumeTotalUsd: 3_100_000,
    volume24hUsd: 980_000,
    trendingScore: 8840,
    yesPrice: 0.22,
    liquidityUsd: 720_000,
    createdDaysAgo: 60,
    closesAtIso: "2026-12-31T23:00:00.000Z",
  },
  {
    slug: "election-turnout-2028",
    title: "US turnout above 64% in the 2028 general election?",
    categorySlug: "politics",
    volumeTotalUsd: 1_050_000,
    volume24hUsd: 45_000,
    trendingScore: 5210,
    yesPrice: 0.52,
    liquidityUsd: 410_000,
    createdDaysAgo: 200,
    closesAtIso: "2028-11-07T23:00:00.000Z",
  },
  {
    slug: "solana-etf-2026",
    title: "Solana spot ETF approved in the US by end of 2026?",
    categorySlug: "ecosystems",
    volumeTotalUsd: 2_400_000,
    volume24hUsd: 890_000,
    trendingScore: 9650,
    yesPrice: 0.38,
    liquidityUsd: 610_000,
    createdDaysAgo: 14,
    closesAtIso: "2026-12-31T23:00:00.000Z",
  },
  {
    slug: "nba-finals-lakers-2026",
    title: "Lakers win the 2026 NBA Finals?",
    categorySlug: "sports",
    volumeTotalUsd: 820_000,
    volume24hUsd: 310_000,
    trendingScore: 7020,
    yesPrice: 0.18,
    liquidityUsd: 210_000,
    createdDaysAgo: 30,
    closesAtIso: "2026-06-30T23:00:00.000Z",
  },
  {
    slug: "super-bowl-chiefs-2027",
    title: "Chiefs win Super Bowl LXI?",
    categorySlug: "sports",
    volumeTotalUsd: 14_500_000,
    volume24hUsd: 120_000,
    trendingScore: 7880,
    yesPrice: 0.09,
    liquidityUsd: 1_800_000,
    createdDaysAgo: 400,
    closesAtIso: "2027-02-15T23:00:00.000Z",
  },
  {
    slug: "gpt5-pass-bar-exam",
    title: "Will a top LLM pass a bar-exam style benchmark at ≥90% before 2027?",
    categorySlug: "crypto-narratives",
    volumeTotalUsd: 560_000,
    volume24hUsd: 240_000,
    trendingScore: 8310,
    yesPrice: 0.72,
    liquidityUsd: 180_000,
    createdDaysAgo: 21,
    closesAtIso: "2026-12-01T23:00:00.000Z",
  },
  {
    slug: "fusion-net-energy-2028",
    title: "Demonstrated fusion energy gain factor Q_plasma > 1 in a public lab by 2028?",
    categorySlug: "science",
    volumeTotalUsd: 390_000,
    volume24hUsd: 12_000,
    trendingScore: 2980,
    yesPrice: 0.41,
    liquidityUsd: 95_000,
    createdDaysAgo: 300,
    closesAtIso: "2028-12-31T23:00:00.000Z",
  },
  {
    slug: "apple-ar-glasses-2026",
    title: "Apple ships consumer AR glasses (non-VR primary) in 2026?",
    categorySlug: "tech",
    volumeTotalUsd: 1_280_000,
    volume24hUsd: 560_000,
    trendingScore: 9020,
    yesPrice: 0.27,
    liquidityUsd: 340_000,
    createdDaysAgo: 18,
    closesAtIso: "2026-12-31T23:00:00.000Z",
  },
  {
    slug: "opec-output-cut-q2",
    title: "OPEC+ announces additional output cuts before Q3 2026?",
    categorySlug: "macro",
    volumeTotalUsd: 670_000,
    volume24hUsd: 95_000,
    trendingScore: 4980,
    yesPrice: 0.55,
    liquidityUsd: 210_000,
    createdDaysAgo: 55,
    closesAtIso: "2026-09-01T23:00:00.000Z",
  },
  {
    slug: "uk-election-labour-majority-2029",
    title: "Labour wins a majority in the next UK general election?",
    categorySlug: "politics",
    volumeTotalUsd: 440_000,
    volume24hUsd: 28_000,
    trendingScore: 3620,
    yesPrice: 0.44,
    liquidityUsd: 120_000,
    createdDaysAgo: 90,
    closesAtIso: "2029-05-31T23:00:00.000Z",
  },
  {
    slug: "messi-mls-mvp-2026",
    title: "Messi wins MLS MVP for the 2026 season?",
    categorySlug: "meme-coins",
    volumeTotalUsd: 290_000,
    volume24hUsd: 410_000,
    trendingScore: 7560,
    yesPrice: 0.33,
    liquidityUsd: 88_000,
    createdDaysAgo: 7,
    closesAtIso: "2026-12-01T23:00:00.000Z",
  },
  {
    slug: "quantum-1000-qubits-2027",
    title: "Public benchmark: ≥1000 logical qubits demonstrated before 2028?",
    categorySlug: "science",
    volumeTotalUsd: 180_000,
    volume24hUsd: 62_000,
    trendingScore: 5450,
    yesPrice: 0.15,
    liquidityUsd: 52_000,
    createdDaysAgo: 25,
    closesAtIso: "2027-12-31T23:00:00.000Z",
  },
  {
    slug: "tiktok-us-ban-reversed-2026",
    title: "TikTok US operations fully restored under same entity by end of 2026?",
    categorySlug: "politics",
    volumeTotalUsd: 2_050_000,
    volume24hUsd: 780_000,
    trendingScore: 9880,
    yesPrice: 0.31,
    liquidityUsd: 520_000,
    createdDaysAgo: 33,
    closesAtIso: "2026-12-31T23:00:00.000Z",
  },
  {
    slug: "base-mainnet-tvl-10b-2026",
    title: "Base chain DeFi TVL exceeds $10B before 2027?",
    categorySlug: "ecosystems",
    volumeTotalUsd: 760_000,
    volume24hUsd: 520_000,
    trendingScore: 9125,
    yesPrice: 0.26,
    liquidityUsd: 190_000,
    createdDaysAgo: 5,
    closesAtIso: "2026-12-31T23:00:00.000Z",
  },
  {
    slug: "cpi-under-3pct-dec-2026",
    title: "US CPI YoY below 3.0% for December 2026 print?",
    categorySlug: "macro",
    volumeTotalUsd: 3_400_000,
    volume24hUsd: 140_000,
    trendingScore: 7230,
    yesPrice: 0.58,
    liquidityUsd: 680_000,
    createdDaysAgo: 150,
    closesAtIso: "2027-01-15T23:00:00.000Z",
  },
  {
    slug: "openai-ipo-2027",
    title: "OpenAI completes an IPO before 2028?",
    categorySlug: "industry-events",
    volumeTotalUsd: 22_000_000,
    volume24hUsd: 95_000,
    trendingScore: 8620,
    yesPrice: 0.19,
    liquidityUsd: 4_200_000,
    createdDaysAgo: 180,
    closesAtIso: "2027-12-31T23:00:00.000Z",
  },
  {
    slug: "hurricane-season-above-normal-2026",
    title: "NOAA Atlantic hurricane season 2026 classified above normal?",
    categorySlug: "science",
    volumeTotalUsd: 210_000,
    volume24hUsd: 18_000,
    trendingScore: 2890,
    yesPrice: 0.49,
    liquidityUsd: 72_000,
    createdDaysAgo: 110,
    closesAtIso: "2027-01-31T23:00:00.000Z",
  },
  {
    slug: "uefa-champs-real-madrid-2027",
    title: "Real Madrid wins the UEFA Champions League in the 2026-27 season?",
    categorySlug: "sports",
    volumeTotalUsd: 5_600_000,
    volume24hUsd: 670_000,
    trendingScore: 9340,
    yesPrice: 0.14,
    liquidityUsd: 910_000,
    createdDaysAgo: 70,
    closesAtIso: "2027-06-30T23:00:00.000Z",
  },
  {
    slug: "humane-ai-pin-discontinued-2026",
    title: "Humane AI Pin formally discontinued before 2027?",
    categorySlug: "tech",
    volumeTotalUsd: 125_000,
    volume24hUsd: 8_500,
    trendingScore: 2120,
    yesPrice: 0.67,
    liquidityUsd: 41_000,
    createdDaysAgo: 2,
    closesAtIso: "2026-12-31T23:00:00.000Z",
  },
  {
    slug: "new-stablecoin-act-us-2026",
    title: "US passes federal stablecoin market-structure legislation in 2026?",
    categorySlug: "politics",
    volumeTotalUsd: 1_920_000,
    volume24hUsd: 420_000,
    trendingScore: 9795,
    yesPrice: 0.36,
    liquidityUsd: 480_000,
    createdDaysAgo: 11,
    closesAtIso: "2026-12-31T23:00:00.000Z",
  },
  {
    slug: "nvidia-5trillion-mcap-2026",
    title: "NVDA market cap exceeds $5T intraday before 2027?",
    categorySlug: "macro",
    volumeTotalUsd: 6_100_000,
    volume24hUsd: 2_100_000,
    trendingScore: 11020,
    yesPrice: 0.42,
    liquidityUsd: 1_400_000,
    createdDaysAgo: 88,
    closesAtIso: "2026-12-31T23:00:00.000Z",
  },
  {
    slug: "dogecoin-etf-2027",
    title: "Dogecoin-linked ETF listed on a major US exchange before 2028?",
    categorySlug: "crypto",
    volumeTotalUsd: 480_000,
    volume24hUsd: 190_000,
    trendingScore: 7980,
    yesPrice: 0.11,
    liquidityUsd: 140_000,
    createdDaysAgo: 3,
    closesAtIso: "2027-12-31T23:00:00.000Z",
  },
];

function seedNarrativeFor(row: { categorySlug: string; title: string }): string {
  const title = row.title.toLowerCase();
  if (title.includes("base")) return "Base";
  if (title.includes("solana")) return "Solana";
  if (title.includes("rwa")) return "RWA";
  if (title.includes("doge") || title.includes("meme")) return "Memes";
  if (title.includes("openai") || title.includes("ai ") || title.includes("humane"))
    return "AI";
  if (title.includes("etf") || title.includes("cpi") || title.includes("nvda")) return "ETF";

  const byCat: Record<string, string> = {
    "crypto-narratives": "Memes",
    ecosystems: "Base",
    crypto: "DeFi",
    macro: "ETF",
    tech: "AI",
    "industry-events": "AI",
    science: "RWA",
    sports: "Gaming",
    politics: "DeFi",
    "meme-coins": "Memes",
  };
  return byCat[row.categorySlug] ?? "AI";
}

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name },
      update: { name: c.name },
    });
  }

  const catIds = new Map<string, string>();
  const allCats = await prisma.category.findMany({
    where: { slug: { in: [...CATEGORIES.map((x) => x.slug)] } },
  });
  for (const c of allCats) catIds.set(c.slug, c.id);

  for (const row of MARKETS) {
    const categoryId = catIds.get(row.categorySlug);
    if (!categoryId) throw new Error(`Missing category ${row.categorySlug}`);

    const opensAt = new Date(Date.now() - (row.createdDaysAgo + 5) * 86_400_000);
    const createdAt = new Date(Date.now() - row.createdDaysAgo * 86_400_000);

    const market = await prisma.market.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        title: row.title,
        status: MarketStatus.OPEN,
        categoryId,
        opensAt,
        closesAt: new Date(row.closesAtIso),
        createdAt,
        yesPrice: new Prisma.Decimal(row.yesPrice),
        volumeTotalUsd: new Prisma.Decimal(row.volumeTotalUsd),
        volume24hUsd: new Prisma.Decimal(row.volume24hUsd),
        liquidityUsd: new Prisma.Decimal(row.liquidityUsd),
        trendingScore: new Prisma.Decimal(row.trendingScore),
      },
      update: {
        title: row.title,
        status: MarketStatus.OPEN,
        categoryId,
        closesAt: new Date(row.closesAtIso),
        yesPrice: new Prisma.Decimal(row.yesPrice),
        volumeTotalUsd: new Prisma.Decimal(row.volumeTotalUsd),
        volume24hUsd: new Prisma.Decimal(row.volume24hUsd),
        liquidityUsd: new Prisma.Decimal(row.liquidityUsd),
        trendingScore: new Prisma.Decimal(row.trendingScore),
      },
    });

    const narrative = seedNarrativeFor(row);
    const linked = await prisma.marketSuggestion.findUnique({
      where: { marketId: market.id },
      select: { id: true, narrative: true },
    });
    if (!linked) {
      await prisma.marketSuggestion.create({
        data: {
          title: market.title,
          category: row.categorySlug,
          narrative,
          status: "APPROVED",
          marketId: market.id,
        },
      });
    } else if (!linked.narrative) {
      await prisma.marketSuggestion.update({
        where: { id: linked.id },
        data: { narrative },
      });
    }
  }

  const attentionSeed: {
    narrative: string;
    score: number;
    trend: NarrativeTrend;
    previousScore: number;
  }[] = [
    { narrative: "AI", score: 72, trend: NarrativeTrend.RISING, previousScore: 61 },
    { narrative: "Memes", score: 58, trend: NarrativeTrend.COOLING, previousScore: 65 },
    { narrative: "Base", score: 64, trend: NarrativeTrend.RISING, previousScore: 56 },
    { narrative: "Solana", score: 59, trend: NarrativeTrend.STABLE, previousScore: 58 },
    { narrative: "RWA", score: 55, trend: NarrativeTrend.RISING, previousScore: 48 },
    { narrative: "Gaming", score: 42, trend: NarrativeTrend.COOLING, previousScore: 47 },
    { narrative: "DeFi", score: 51, trend: NarrativeTrend.STABLE, previousScore: 50 },
    { narrative: "ETF", score: 48, trend: NarrativeTrend.RISING, previousScore: 44 },
  ];

  for (const row of attentionSeed) {
    await prisma.attentionScore.upsert({
      where: { narrative: row.narrative },
      create: {
        narrative: row.narrative,
        score: new Prisma.Decimal(row.score),
        trend: row.trend,
        previousScore: new Prisma.Decimal(row.previousScore),
      },
      update: {
        score: new Prisma.Decimal(row.score),
        trend: row.trend,
        previousScore: new Prisma.Decimal(row.previousScore),
      },
    });
  }

  const suggestionTitles = [
    "Will AI tokens outperform memecoins this month?",
    "Will Base TVL exceed Solana this quarter?",
    "Will RWA narratives beat gaming flows in 30 days?",
  ];
  for (const title of suggestionTitles) {
    const existing = await prisma.marketSuggestion.findFirst({ where: { title } });
    if (!existing) {
      await prisma.marketSuggestion.create({
        data: {
          title,
          category: "crypto-narratives",
          votesUp: Math.floor(12 + Math.random() * 40),
          status: "PENDING",
        },
      });
    }
  }

  // PlatformConfig defaults
  const defaultConfigs = [
    { key: 'attention_weight_volume',         value: '30' },
    { key: 'attention_weight_liquidity',      value: '20' },
    { key: 'attention_weight_markets',        value: '15' },
    { key: 'attention_weight_traders',        value: '20' },
    { key: 'attention_weight_engagement',     value: '15' },
    { key: 'conviction_weight_capital',       value: '35' },
    { key: 'conviction_weight_position_size', value: '25' },
    { key: 'conviction_weight_liquidity',     value: '20' },
    { key: 'conviction_weight_open_positions',value: '20' },
    { key: 'creator_default_reward_percent',  value: '5'  },
    { key: 'momentum_growing_threshold',      value: '5'  },
    { key: 'momentum_cooling_threshold',      value: '-5' },
  ]

  for (const config of defaultConfigs) {
    await prisma.platformConfig.upsert({
      where:  { key: config.key },
      update: {},
      create: config,
    })
  }
  console.log('Seeded PlatformConfig defaults')

  const count = await prisma.market.count({ where: { status: MarketStatus.OPEN } });
  console.log(`Seed complete: ${MARKETS.length} markets upserted; ${count} OPEN markets in DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
