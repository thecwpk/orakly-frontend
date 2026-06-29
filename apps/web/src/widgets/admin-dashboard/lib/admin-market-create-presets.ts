/** Hub narrative keys used for discovery chips and attention lanes. */
export type AdminNarrativeKey =
  | "AI"
  | "DeFi"
  | "ETF"
  | "Memes"
  | "macro"
  | "politics"
  | "sports"
  | "science"
  | "market-sentiment"
  | "industry-events"
  | "ecosystems";

export type AdminNarrativeOption = {
  key: AdminNarrativeKey;
  label: string;
  description: string;
  /** Preferred category slug when a matching row exists in admin taxonomy. */
  categorySlug: string;
  exampleTitle: string;
};

export const ADMIN_NARRATIVE_OPTIONS: readonly AdminNarrativeOption[] = [
  {
    key: "market-sentiment",
    label: "Market sentiment",
    description: "Price targets, ATHs, and broad risk-on / risk-off questions.",
    categorySlug: "macro",
    exampleTitle: "Will BTC hit a new all-time high in Q3 2026?",
  },
  {
    key: "macro",
    label: "Macro",
    description: "Fed, CPI, rates, and economic prints traders hedge around.",
    categorySlug: "macro",
    exampleTitle: "Will the Fed cut rates before July 2026?",
  },
  {
    key: "AI",
    label: "AI & tech",
    description: "Model milestones, IPOs, product launches, and chip demand.",
    categorySlug: "tech",
    exampleTitle: "OpenAI completes an IPO before 2028?",
  },
  {
    key: "industry-events",
    label: "Industry events",
    description: "ETF approvals, regulation, and corporate catalysts.",
    categorySlug: "tech",
    exampleTitle: "Solana spot ETF approved in the US by end of 2026?",
  },
  {
    key: "ecosystems",
    label: "Ecosystems",
    description: "Chain TVL, L2 adoption, and ecosystem growth metrics.",
    categorySlug: "crypto",
    exampleTitle: "Base chain DeFi TVL exceeds $10B before 2027?",
  },
  {
    key: "sports",
    label: "Sports",
    description: "Championships, awards, and season outcomes.",
    categorySlug: "sports",
    exampleTitle: "Chiefs win Super Bowl LXI?",
  },
  {
    key: "politics",
    label: "Politics",
    description: "Elections, legislation, and policy outcomes.",
    categorySlug: "politics",
    exampleTitle: "US turnout above 64% in the 2028 general election?",
  },
  {
    key: "science",
    label: "Science",
    description: "Research milestones, climate prints, and lab benchmarks.",
    categorySlug: "science",
    exampleTitle:
      "Demonstrated fusion energy gain factor Q_plasma > 1 in a public lab by 2028?",
  },
  {
    key: "Memes",
    label: "Meme coins",
    description: "Meme-linked ETFs, listings, and culture-driven assets.",
    categorySlug: "meme-coins",
    exampleTitle: "Dogecoin-linked ETF listed on a major US exchange before 2028?",
  },
  {
    key: "DeFi",
    label: "DeFi",
    description: "Protocol TVL, token flips, and on-chain market structure.",
    categorySlug: "crypto",
    exampleTitle: "Will ETH market cap exceed BTC before 2027?",
  },
  {
    key: "ETF",
    label: "ETF",
    description: "Spot and thematic ETF approvals and launches.",
    categorySlug: "macro",
    exampleTitle: "NVDA market cap exceeds $5T intraday before 2027?",
  },
] as const;

export type AdminMarketTemplate = {
  id: string;
  label: string;
  narrative: AdminNarrativeKey;
  title: string;
  slug: string;
  description: string;
  categorySlug: string;
  closesInDays: number;
  liquiditySeedUsd: number;
  initialProbability: number;
  takerFeeBps: number;
};

export const ADMIN_MARKET_TEMPLATES: readonly AdminMarketTemplate[] = [
  {
    id: "btc-ath",
    label: "Crypto ATH",
    narrative: "market-sentiment",
    title: "Will BTC hit a new all-time high in Q3 2026?",
    slug: "btc-ath-q3-2026",
    description:
      "Resolves YES if Coinbase BTC-USD prints a daily close above the prior all-time high before 2026-10-01 00:00 UTC.",
    categorySlug: "crypto",
    closesInDays: 120,
    liquiditySeedUsd: 25_000,
    initialProbability: 0.47,
    takerFeeBps: 25,
  },
  {
    id: "fed-cut",
    label: "Fed cut",
    narrative: "macro",
    title: "Will the Fed cut rates before July 2026?",
    slug: "fed-cut-before-july-2026",
    description:
      "Resolves YES on the first FOMC statement that lowers the upper bound of the federal funds target range before 2026-07-01.",
    categorySlug: "macro",
    closesInDays: 90,
    liquiditySeedUsd: 10_000,
    initialProbability: 0.61,
    takerFeeBps: 25,
  },
  {
    id: "openai-ipo",
    label: "AI IPO",
    narrative: "AI",
    title: "OpenAI completes an IPO before 2028?",
    slug: "openai-ipo-before-2028",
    description:
      "Resolves YES if OpenAI common stock begins regular-way trading on a major US exchange before 2028-01-01.",
    categorySlug: "tech",
    closesInDays: 540,
    liquiditySeedUsd: 50_000,
    initialProbability: 0.19,
    takerFeeBps: 25,
  },
  {
    id: "super-bowl",
    label: "Super Bowl",
    narrative: "sports",
    title: "Chiefs win Super Bowl LXI?",
    slug: "chiefs-super-bowl-lxi",
    description:
      "Resolves YES if the Kansas City Chiefs win Super Bowl LXI per official NFL result.",
    categorySlug: "sports",
    closesInDays: 300,
    liquiditySeedUsd: 15_000,
    initialProbability: 0.09,
    takerFeeBps: 25,
  },
  {
    id: "sol-etf",
    label: "Solana ETF",
    narrative: "ETF",
    title: "Solana spot ETF approved in the US by end of 2026?",
    slug: "solana-spot-etf-2026",
    description:
      "Resolves YES if the SEC approves a spot Solana ETF for listing before 2027-01-01.",
    categorySlug: "crypto",
    closesInDays: 200,
    liquiditySeedUsd: 20_000,
    initialProbability: 0.38,
    takerFeeBps: 25,
  },
] as const;

export const LIQUIDITY_SEED_PRESETS = [5_000, 10_000, 25_000, 100_000] as const;

export function defaultClosesAtLocal(daysFromNow: number): string {
  const d = new Date(Date.now() + daysFromNow * 86_400_000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

export function findCategoryIdForSlug(
  categories: ReadonlyArray<{ id: string; slug: string }>,
  slug: string,
): string {
  const hit = categories.find((c) => c.slug === slug);
  return hit?.id ?? "";
}
