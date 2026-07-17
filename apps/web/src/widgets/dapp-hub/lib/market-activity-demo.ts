import type { MarketActivityEvent } from "@/shared/contracts/market-activity";

function minsAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

/** ≥5 mock items per feed kind — used when API panels are sparse. */
export const MARKET_ACTIVITY_DEMO: Record<
  MarketActivityEvent["kind"],
  MarketActivityEvent[]
> = {
  TRADE: [
    {
      id: "demo-trade-1",
      kind: "TRADE",
      at: minsAgo(2),
      question: "Will GPT-5 launch before end of Q4 2026?",
      marketSlug: "demo-ai-gpt5-q4",
      walletAddress: "0x81a4c2f9d0e7b36a991234567890abcdef01",
      outcome: "YES",
      amountBnb: 2400,
    },
    {
      id: "demo-trade-2",
      kind: "TRADE",
      at: minsAgo(8),
      question: "Will DOGE market cap exceed $50B by Dec 2026?",
      marketSlug: "demo-memes-doge-50b",
      walletAddress: "0xb2c81f0044aa99112233445566778899aabb",
      outcome: "NO",
      amountBnb: 820,
    },
    {
      id: "demo-trade-3",
      kind: "TRADE",
      at: minsAgo(14),
      question: "Will BNB trade above $800 before Sep 2026?",
      marketSlug: "demo-bnb-price-800",
      walletAddress: "0xdem000000000000000000000000000000001",
      outcome: "YES",
      amountBnb: 1250,
    },
    {
      id: "demo-trade-4",
      kind: "TRADE",
      at: minsAgo(22),
      question: "Aave TVL back above $20B before 2027?",
      marketSlug: "demo-defi-aave-tvl",
      walletAddress: "0x4f9e2188ccd0011223344556677889900aa",
      outcome: "YES",
      amountBnb: 540,
    },
    {
      id: "demo-trade-5",
      kind: "TRADE",
      at: minsAgo(35),
      question: "PEPE hits a new all-time high in 2026?",
      marketSlug: "demo-memes-pepe-ath",
      walletAddress: "0x99aa11bb22cc33dd44ee55ff667788990011",
      outcome: "NO",
      amountBnb: 3100,
    },
  ],
  MARKET_APPROVED: [
    {
      id: "demo-appr-1",
      kind: "MARKET_APPROVED",
      at: minsAgo(12),
      question: "Will Binance List XYZ Token before August?",
      marketSlug: "demo-binance-xyz",
      category: "Exchange",
    },
    {
      id: "demo-appr-2",
      kind: "MARKET_APPROVED",
      at: minsAgo(40),
      question: "opBNB TVL exceeds $1B by end of 2026?",
      marketSlug: "demo-bnb-opbnb-tvl",
      category: "BNB",
    },
    {
      id: "demo-appr-3",
      kind: "MARKET_APPROVED",
      at: minsAgo(55),
      question: "Restaking protocols reach $25B TVL by year-end?",
      marketSlug: "demo-defi-restaking",
      category: "DeFi",
    },
    {
      id: "demo-appr-4",
      kind: "MARKET_APPROVED",
      at: minsAgo(90),
      question: "Will NVIDIA market cap exceed $4T by Dec 2026?",
      marketSlug: "demo-ai-nvda-3t",
      category: "AI",
    },
    {
      id: "demo-appr-5",
      kind: "MARKET_APPROVED",
      at: minsAgo(120),
      question: "Base sequencer revenue above $50M this year?",
      marketSlug: "demo-base-sequencer",
      category: "Base",
    },
  ],
  MARKET_CREATED: [
    {
      id: "demo-create-1",
      kind: "MARKET_CREATED",
      at: minsAgo(6),
      question: "PEPE ETF approved in the US by 2027?",
      marketSlug: "demo-pepe-etf",
      category: "Memes",
    },
    {
      id: "demo-create-2",
      kind: "MARKET_CREATED",
      at: minsAgo(18),
      question: "Will AI agent protocols surpass $2B TVL in 2026?",
      marketSlug: "demo-ai-agents-tvl",
      category: "AI",
    },
    {
      id: "demo-create-3",
      kind: "MARKET_CREATED",
      at: minsAgo(28),
      question: "CZ keynotes a major crypto conference in 2026?",
      marketSlug: "demo-bnb-cz-speech",
      category: "BNB",
    },
    {
      id: "demo-create-4",
      kind: "MARKET_CREATED",
      at: minsAgo(48),
      question: "USDC + USDT combined supply above $250B in 2026?",
      marketSlug: "demo-defi-stablecoins",
      category: "DeFi",
    },
    {
      id: "demo-create-5",
      kind: "MARKET_CREATED",
      at: minsAgo(70),
      question: "New BNB meme hits $100M FDV in 48h?",
      marketSlug: "demo-bnb-meme-fdv",
      category: "Memes",
    },
  ],
  MARKET_CLOSING: [
    {
      id: "demo-close-1",
      kind: "MARKET_CLOSING",
      at: hoursFromNow(18),
      question: "Ethereum Upgrade: Fusaka Activation",
      marketSlug: "demo-eth-upgrade",
      category: "Ethereum",
      hoursUntilClose: 18,
      volumeUsd: 1_200_000,
    },
    {
      id: "demo-close-2",
      kind: "MARKET_CLOSING",
      at: hoursFromNow(8),
      question: "Will DOGE market cap exceed $50B by Dec 2026?",
      marketSlug: "demo-memes-doge-50b",
      category: "Memes",
      hoursUntilClose: 8,
      volumeUsd: 3_100_000,
    },
    {
      id: "demo-close-3",
      kind: "MARKET_CLOSING",
      at: hoursFromNow(30),
      question: "PEPE hits a new all-time high in 2026?",
      marketSlug: "demo-memes-pepe-ath",
      category: "Memes",
      hoursUntilClose: 30,
      volumeUsd: 1_650_000,
    },
    {
      id: "demo-close-4",
      kind: "MARKET_CLOSING",
      at: hoursFromNow(12),
      question: "opBNB TVL exceeds $1B by end of 2026?",
      marketSlug: "demo-bnb-opbnb-tvl",
      category: "BNB",
      hoursUntilClose: 12,
      volumeUsd: 780_000,
    },
    {
      id: "demo-close-5",
      kind: "MARKET_CLOSING",
      at: hoursFromNow(40),
      question: "Restaking protocols reach $25B TVL by year-end?",
      marketSlug: "demo-defi-restaking",
      category: "DeFi",
      hoursUntilClose: 40,
      volumeUsd: 920_000,
    },
  ],
  UPCOMING_EVENT: [
    {
      id: "demo-event-1",
      kind: "UPCOMING_EVENT",
      at: minsAgo(5),
      question: "Bitcoin ETF Options Launch Window",
      marketSlug: null,
      eventName: "Bitcoin ETF Options Launch Window",
      eventWhenLabel: "In 3 days",
    },
    {
      id: "demo-event-2",
      kind: "UPCOMING_EVENT",
      at: minsAgo(15),
      question: "ETH Fusaka Upgrade Expected",
      marketSlug: null,
      eventName: "ETH Fusaka Upgrade Expected",
      eventWhenLabel: "Tomorrow",
    },
    {
      id: "demo-event-3",
      kind: "UPCOMING_EVENT",
      at: minsAgo(25),
      question: "BNB Chain Hackathon Finals",
      marketSlug: null,
      eventName: "BNB Chain Hackathon Finals",
      eventWhenLabel: "In 5 days",
    },
    {
      id: "demo-event-4",
      kind: "UPCOMING_EVENT",
      at: minsAgo(45),
      question: "FOMC Rate Decision",
      marketSlug: null,
      eventName: "FOMC Rate Decision",
      eventWhenLabel: "In 12 days",
    },
    {
      id: "demo-event-5",
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
      id: "demo-vote-1",
      kind: "COMMUNITY_VOTE",
      at: minsAgo(3),
      question: "Will AI tokens outperform L1 beta this month?",
      marketSlug: null,
      voteCount: 48,
      suggestionId: "demo-sug-1",
      category: "AI",
    },
    {
      id: "demo-vote-2",
      kind: "COMMUNITY_VOTE",
      at: minsAgo(11),
      question: "Will DOGE flip ADA again in 2026?",
      marketSlug: null,
      voteCount: 62,
      suggestionId: "demo-sug-2",
      category: "Memes",
    },
    {
      id: "demo-vote-3",
      kind: "COMMUNITY_VOTE",
      at: minsAgo(19),
      question: "BNB Greenfield storage deals exceed 10k?",
      marketSlug: null,
      voteCount: 36,
      suggestionId: "demo-sug-3",
      category: "BNB",
    },
    {
      id: "demo-vote-4",
      kind: "COMMUNITY_VOTE",
      at: minsAgo(33),
      question: "EigenLayer AVS count above 50 by Q3?",
      marketSlug: null,
      voteCount: 29,
      suggestionId: "demo-sug-4",
      category: "DeFi",
    },
    {
      id: "demo-vote-5",
      kind: "COMMUNITY_VOTE",
      at: minsAgo(50),
      question: "BlackRock tokenized T-bill on BNB?",
      marketSlug: null,
      voteCount: 33,
      suggestionId: "demo-sug-5",
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

  if (fromApi.length >= min) {
    return { items: fromApi.slice(0, min), usedDemo: false };
  }

  const demo = MARKET_ACTIVITY_DEMO[kind];
  const seen = new Set(fromApi.map((e) => e.id));
  const merged = [...fromApi];
  for (const row of demo) {
    if (merged.length >= min) break;
    if (seen.has(row.id)) continue;
    merged.push(row);
  }
  return {
    items: merged.slice(0, Math.max(min, merged.length)).slice(0, Math.max(min, 5)),
    usedDemo: fromApi.length < min,
  };
}
