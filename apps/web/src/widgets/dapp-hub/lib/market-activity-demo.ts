import type { MarketActivityEvent } from "@/shared/contracts/market-activity";

function minsAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

/** ≥5 items per feed kind — used when API panels are sparse. Slugs match seed markets. */
export const MARKET_ACTIVITY_DEMO: Record<
  MarketActivityEvent["kind"],
  MarketActivityEvent[]
> = {
  TRADE: [
    {
      id: "act-trade-1",
      kind: "TRADE",
      at: minsAgo(2),
      question: "NVDA market cap exceeds $5T intraday before 2027?",
      marketSlug: "nvidia-5trillion-mcap-2026",
      walletAddress: "0x81a4c2f9d0e7b36a991234567890abcdef01",
      outcome: "YES",
      amountBnb: 2400,
    },
    {
      id: "act-trade-2",
      kind: "TRADE",
      at: minsAgo(8),
      question: "BTC to hit a new all-time high in Q3 2026?",
      marketSlug: "btc-ath-q3-2026",
      walletAddress: "0xb2c81f0044aa99112233445566778899aabb",
      outcome: "NO",
      amountBnb: 820,
    },
    {
      id: "act-trade-3",
      kind: "TRADE",
      at: minsAgo(14),
      question: "Will the Fed cut rates before July 2026?",
      marketSlug: "fed-rate-cut-july-2026",
      walletAddress: "0x55aa66bb77cc88dd99ee00ff1122334455667788",
      outcome: "YES",
      amountBnb: 1250,
    },
    {
      id: "act-trade-4",
      kind: "TRADE",
      at: minsAgo(22),
      question: "Solana spot ETF approved in the US by end of 2026?",
      marketSlug: "solana-etf-2026",
      walletAddress: "0x4f9e22aa00bbccddeeff001122334455667700aa",
      outcome: "YES",
      amountBnb: 540,
    },
    {
      id: "act-trade-5",
      kind: "TRADE",
      at: minsAgo(35),
      question: "Will ETH market cap exceed BTC before 2027?",
      marketSlug: "eth-flip-btc-2027",
      walletAddress: "0x99aa11bb22cc33dd44ee55ff6677889900112233",
      outcome: "NO",
      amountBnb: 3100,
    },
  ],
  MARKET_APPROVED: [
    {
      id: "act-appr-1",
      kind: "MARKET_APPROVED",
      at: minsAgo(12),
      question: "US passes federal stablecoin market-structure legislation in 2026?",
      marketSlug: "new-stablecoin-act-us-2026",
      category: "Politics",
    },
    {
      id: "act-appr-2",
      kind: "MARKET_APPROVED",
      at: minsAgo(40),
      question: "Solana spot ETF approved in the US by end of 2026?",
      marketSlug: "solana-etf-2026",
      category: "Crypto",
    },
    {
      id: "act-appr-3",
      kind: "MARKET_APPROVED",
      at: minsAgo(55),
      question: "Real Madrid wins the UEFA Champions League in the 2026-27 season?",
      marketSlug: "uefa-champs-real-madrid-2027",
      category: "Sports",
    },
    {
      id: "act-appr-4",
      kind: "MARKET_APPROVED",
      at: minsAgo(90),
      question: "NVDA market cap exceeds $5T intraday before 2027?",
      marketSlug: "nvidia-5trillion-mcap-2026",
      category: "Macro",
    },
    {
      id: "act-appr-5",
      kind: "MARKET_APPROVED",
      at: minsAgo(120),
      question: "OpenAI completes an IPO before 2028?",
      marketSlug: "openai-ipo-2027",
      category: "Tech",
    },
  ],
  MARKET_CREATED: [
    {
      id: "act-create-1",
      kind: "MARKET_CREATED",
      at: minsAgo(6),
      question: "Dogecoin-linked ETF listed on a major US exchange before 2028?",
      marketSlug: "dogecoin-etf-2027",
      category: "Crypto",
    },
    {
      id: "act-create-2",
      kind: "MARKET_CREATED",
      at: minsAgo(18),
      question: "Will a top LLM pass a bar-exam style benchmark at ≥90% before 2027?",
      marketSlug: "gpt5-pass-bar-exam",
      category: "AI",
    },
    {
      id: "act-create-3",
      kind: "MARKET_CREATED",
      at: minsAgo(28),
      question: "Will the Fed cut rates before July 2026?",
      marketSlug: "fed-rate-cut-july-2026",
      category: "Macro",
    },
    {
      id: "act-create-4",
      kind: "MARKET_CREATED",
      at: minsAgo(48),
      question: "US turnout above 64% in the 2028 general election?",
      marketSlug: "election-turnout-2028",
      category: "Politics",
    },
    {
      id: "act-create-5",
      kind: "MARKET_CREATED",
      at: minsAgo(70),
      question: "BTC to hit a new all-time high in Q3 2026?",
      marketSlug: "btc-ath-q3-2026",
      category: "Crypto",
    },
  ],
  MARKET_CLOSING: [
    {
      id: "act-close-1",
      kind: "MARKET_CLOSING",
      at: hoursFromNow(18),
      question: "Will the Fed cut rates before July 2026?",
      marketSlug: "fed-rate-cut-july-2026",
      category: "Macro",
      hoursUntilClose: 18,
      volumeUsd: 4_200_000,
    },
    {
      id: "act-close-2",
      kind: "MARKET_CLOSING",
      at: hoursFromNow(36),
      question: "Will a top LLM pass a bar-exam style benchmark at ≥90% before 2027?",
      marketSlug: "gpt5-pass-bar-exam",
      category: "AI",
      hoursUntilClose: 36,
      volumeUsd: 560_000,
    },
    {
      id: "act-close-3",
      kind: "MARKET_CLOSING",
      at: hoursFromNow(48),
      question: "BTC to hit a new all-time high in Q3 2026?",
      marketSlug: "btc-ath-q3-2026",
      category: "Crypto",
      hoursUntilClose: 48,
      volumeUsd: 9_800_000,
    },
    {
      id: "act-close-4",
      kind: "MARKET_CLOSING",
      at: hoursFromNow(72),
      question: "Solana spot ETF approved in the US by end of 2026?",
      marketSlug: "solana-etf-2026",
      category: "Crypto",
      hoursUntilClose: 72,
      volumeUsd: 2_400_000,
    },
    {
      id: "act-close-5",
      kind: "MARKET_CLOSING",
      at: hoursFromNow(96),
      question: "Will ETH market cap exceed BTC before 2027?",
      marketSlug: "eth-flip-btc-2027",
      category: "Crypto",
      hoursUntilClose: 96,
      volumeUsd: 3_100_000,
    },
  ],
  UPCOMING_EVENT: [
    {
      id: "act-event-1",
      kind: "UPCOMING_EVENT",
      at: minsAgo(5),
      question: "Bitcoin ETF Options Launch Window",
      marketSlug: null,
      eventName: "Bitcoin ETF Options Launch Window",
      eventWhenLabel: "In 3 days",
    },
    {
      id: "act-event-2",
      kind: "UPCOMING_EVENT",
      at: minsAgo(15),
      question: "ETH Fusaka Upgrade Expected",
      marketSlug: null,
      eventName: "ETH Fusaka Upgrade Expected",
      eventWhenLabel: "Tomorrow",
    },
    {
      id: "act-event-3",
      kind: "UPCOMING_EVENT",
      at: minsAgo(25),
      question: "BNB Chain Hackathon Finals",
      marketSlug: null,
      eventName: "BNB Chain Hackathon Finals",
      eventWhenLabel: "In 5 days",
    },
    {
      id: "act-event-4",
      kind: "UPCOMING_EVENT",
      at: minsAgo(45),
      question: "FOMC Rate Decision",
      marketSlug: null,
      eventName: "FOMC Rate Decision",
      eventWhenLabel: "In 12 days",
    },
    {
      id: "act-event-5",
      kind: "UPCOMING_EVENT",
      at: minsAgo(80),
      question: "Solana Breakpoint Conference",
      marketSlug: null,
      eventName: "Solana Breakpoint Conference",
      eventWhenLabel: "In 3 weeks",
    },
  ],
  COMMUNITY_VOTE: [
    {
      id: "act-vote-1",
      kind: "COMMUNITY_VOTE",
      at: minsAgo(3),
      question: "Will AI tokens outperform L1 beta this month?",
      marketSlug: null,
      voteCount: 48,
      suggestionId: "sug-1",
      category: "AI",
    },
    {
      id: "act-vote-2",
      kind: "COMMUNITY_VOTE",
      at: minsAgo(11),
      question: "Will DOGE flip ADA again in 2026?",
      marketSlug: null,
      voteCount: 62,
      suggestionId: "sug-2",
      category: "Memes",
    },
    {
      id: "act-vote-3",
      kind: "COMMUNITY_VOTE",
      at: minsAgo(19),
      question: "BNB Greenfield storage deals exceed 10k?",
      marketSlug: null,
      voteCount: 36,
      suggestionId: "sug-3",
      category: "BNB",
    },
    {
      id: "act-vote-4",
      kind: "COMMUNITY_VOTE",
      at: minsAgo(33),
      question: "EigenLayer AVS count above 50 by Q3?",
      marketSlug: null,
      voteCount: 29,
      suggestionId: "sug-4",
      category: "DeFi",
    },
    {
      id: "act-vote-5",
      kind: "COMMUNITY_VOTE",
      at: minsAgo(50),
      question: "BlackRock tokenized T-bill on BNB?",
      marketSlug: null,
      voteCount: 33,
      suggestionId: "sug-5",
      category: "RWA",
    },
  ],
};

export type ActivityFeedPanelId =
  | "trades"
  | "approved"
  | "created"
  | "closing"
  | "events"
  | "votes";

export const ACTIVITY_FEED_PANELS: readonly {
  id: ActivityFeedPanelId;
  kind: MarketActivityEvent["kind"];
  title: string;
  accent: string;
}[] = [
  { id: "trades", kind: "TRADE", title: "Recent Trades", accent: "text-emerald-400" },
  {
    id: "approved",
    kind: "MARKET_APPROVED",
    title: "Recently Approved",
    accent: "text-blue-400",
  },
  {
    id: "created",
    kind: "MARKET_CREATED",
    title: "Recently Created",
    accent: "text-teal-400",
  },
  {
    id: "closing",
    kind: "MARKET_CLOSING",
    title: "Closing Soon",
    accent: "text-amber-400",
  },
  {
    id: "events",
    kind: "UPCOMING_EVENT",
    title: "Upcoming Crypto Events",
    accent: "text-slate-300",
  },
  {
    id: "votes",
    kind: "COMMUNITY_VOTE",
    title: "Latest Community Votes",
    accent: "text-violet-400",
  },
] as const;

export function fillFeedPanel(
  kind: MarketActivityEvent["kind"],
  live: MarketActivityEvent[],
  min = 5,
): { items: MarketActivityEvent[]; usedDemo: boolean } {
  const fromApi = live
    .filter((e) => e.kind === kind)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    items: fromApi.slice(0, Math.max(min, 5)),
    usedDemo: false,
  };
}
