import type {
  CategoryMix,
  EquityPoint,
  PositionExposure,
  ProfileTrade,
  ProfileWindow,
  TraderProfile,
} from "./types";

/* ---------------------------------------------------------------- */
/* Deterministic seed                                                 */
/* ---------------------------------------------------------------- */

function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/* ---------------------------------------------------------------- */
/* Shared catalog                                                     */
/* ---------------------------------------------------------------- */

const SAMPLE_MARKETS: ReadonlyArray<{ slug: string; title: string; category: string }> = [
  { slug: "btc-ath-q3", title: "BTC reaches new all-time high in Q3", category: "Crypto" },
  { slug: "eth-flippening-2026", title: "ETH/BTC ratio above 0.07 by year end", category: "Crypto" },
  { slug: "fed-rate-cut-june", title: "Fed cuts rates by July FOMC", category: "Macro" },
  { slug: "us-cpi-feb-print", title: "US CPI print under 3.0% in Feb", category: "Macro" },
  { slug: "election-turnout-2028", title: "US 2028 voter turnout above 64%", category: "Politics" },
  { slug: "openai-q3-revenue", title: "OpenAI ARR > $20B by Q3", category: "Tech" },
  { slug: "champions-league-final", title: "Real Madrid wins Champions League", category: "Sports" },
  { slug: "ufc-310-main-card", title: "UFC 310 main card payout > 50%", category: "Sports" },
  { slug: "doge-1usd", title: "DOGE > $1 by 2027", category: "Crypto" },
  { slug: "ai-bill-passes", title: "AI Safety Act passes Senate", category: "Politics" },
];

const ALIAS_POOL = [
  "ConvexAlpha",
  "MacroDelta",
  "OdinTrader",
  "MicrostructX",
  "BetaHunter",
  "GammaSquid",
  "OracleSnipe",
  "LiquidityKnight",
  "TermStructure",
  "MeanReverter",
  "SkewSurfer",
  "VarianceVault",
  "TickAttacker",
  "AzimuthCap",
  "Quark",
];

const FALLBACK_ADDRESS = "0x1d3acaffe8eaef901a2d3aabbcc2231ee71";

/* ---------------------------------------------------------------- */
/* Window scaling                                                     */
/* ---------------------------------------------------------------- */

const WINDOW_SCALE: Record<ProfileWindow, number> = {
  "24h": 0.05,
  "7d": 0.28,
  "30d": 1,
  "90d": 2.4,
  all: 5,
};

const WINDOW_POINTS: Record<ProfileWindow, number> = {
  "24h": 24,
  "7d": 56,
  "30d": 60,
  "90d": 90,
  all: 120,
};

/* ---------------------------------------------------------------- */
/* Builders                                                           */
/* ---------------------------------------------------------------- */

function buildEquityCurve(rand: () => number, points: number, biasUp: boolean): EquityPoint[] {
  const out: EquityPoint[] = [];
  let v = 10_000 + rand() * 50_000;
  const drift = biasUp ? 220 : -90;
  const now = Date.now();
  // Walk backwards in time so the latest point is "now".
  for (let i = points - 1; i >= 0; i--) {
    const at = new Date(now - i * 60 * 60 * 1000).toISOString();
    const noise = (rand() - 0.5) * 2_400;
    v = Math.max(1_000, v + drift + noise);
    out.push({ at, equity: Math.round(v) });
  }
  return out;
}

function buildTrades(
  rand: () => number,
  count: number,
  scale: number,
): ProfileTrade[] {
  const trades: ProfileTrade[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const m = SAMPLE_MARKETS[Math.floor(rand() * SAMPLE_MARKETS.length)]!;
    const side: "YES" | "NO" = rand() > 0.5 ? "YES" : "NO";
    const action: "BUY" | "SELL" = rand() > 0.4 ? "BUY" : "SELL";
    const sizeUsd = (300 + rand() * 4_700) * Math.max(0.4, scale);
    /* PnL distribution skewed positive (~60% wins). */
    const winning = rand() < 0.6;
    const pnlUsd = winning
      ? sizeUsd * (0.05 + rand() * 0.25)
      : -sizeUsd * (0.04 + rand() * 0.18);
    const ageMs = i * (1_000 * 60 * (4 + Math.floor(rand() * 22)));
    trades.push({
      id: `t_${i}_${Math.floor(rand() * 1e6)}`,
      marketSlug: m.slug,
      marketTitle: m.title,
      marketCategory: m.category,
      side,
      action,
      sizeUsd: Math.round(sizeUsd),
      pnlUsd: Math.round(pnlUsd),
      at: new Date(now - ageMs).toISOString(),
    });
  }
  return trades;
}

function buildExposures(
  rand: () => number,
  scale: number,
): { exposures: PositionExposure[]; categoryMix: CategoryMix[] } {
  const picks = [...SAMPLE_MARKETS]
    .sort(() => rand() - 0.5)
    .slice(0, 6 + Math.floor(rand() * 3));

  const exposures: PositionExposure[] = picks.map((m) => ({
    marketSlug: m.slug,
    marketTitle: m.title,
    category: m.category,
    notionalUsd: Math.round((400 + rand() * 8_000) * Math.max(0.4, scale)),
    side: rand() > 0.5 ? "YES" : "NO",
    markProb: 0.1 + rand() * 0.8,
  }));

  const total = exposures.reduce((acc, e) => acc + e.notionalUsd, 0) || 1;
  const byCategory = new Map<string, number>();
  for (const e of exposures) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.notionalUsd);
  }
  const categoryMix: CategoryMix[] = [...byCategory.entries()]
    .map(([category, notionalUsd]) => ({
      category,
      notionalUsd,
      pct: (notionalUsd / total) * 100,
    }))
    .sort((a, b) => b.notionalUsd - a.notionalUsd);

  return {
    exposures: exposures.sort((a, b) => b.notionalUsd - a.notionalUsd),
    categoryMix,
  };
}

/* ---------------------------------------------------------------- */
/* Public API                                                         */
/* ---------------------------------------------------------------- */

export function buildTraderProfile({
  address,
  window,
  isMine,
}: {
  address?: string;
  window: ProfileWindow;
  isMine: boolean;
}): TraderProfile {
  const addr = address?.trim() || FALLBACK_ADDRESS;
  const rand = rng(hash(`${addr}:profile`));
  const windowRand = rng(hash(`${addr}:${window}`));

  const skill = 0.5 + rand() * 0.45;
  const scale = WINDOW_SCALE[window];
  const points = WINDOW_POINTS[window];

  const volumeUsd = (300_000 + rand() * 9_000_000) * scale;
  const roiPct = (skill - 0.5) * 35 + (windowRand() - 0.5) * 12;
  const pnlUsd = Math.round(volumeUsd * (roiPct / 100));
  const winRatePct = Math.max(32, Math.min(94, skill * 100 + (windowRand() - 0.5) * 18));

  const tradesCount = Math.max(8, Math.round(volumeUsd / 9_500 * 0.6 + windowRand() * 12));
  const trades = buildTrades(windowRand, Math.min(80, tradesCount), scale);
  const equity = buildEquityCurve(windowRand, points, pnlUsd >= 0);
  const { exposures, categoryMix } = buildExposures(rand, scale);

  /* Best single trade. */
  let bestTradeUsd = 0;
  for (const t of trades) {
    if (t.pnlUsd > bestTradeUsd) bestTradeUsd = t.pnlUsd;
  }

  /* Streak: count consecutive wins from most recent. */
  let streak = 0;
  for (const t of [...trades].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))) {
    if (t.pnlUsd > 0) streak += 1;
    else break;
  }

  const aliasIdx = Math.abs(hash(addr)) % ALIAS_POOL.length;
  const alias = isMine ? "You" : ALIAS_POOL[aliasIdx]!;

  /* Approximate 24h delta from the last 24 equity points. */
  const last = equity[equity.length - 1]?.equity ?? 0;
  const yest = equity[Math.max(0, equity.length - 24)]?.equity ?? last;
  const delta24h = yest > 0 ? ((last - yest) / yest) * 100 : 0;

  return {
    address: addr,
    alias,
    joinedAt: new Date(
      Date.now() - (180 + Math.floor(rand() * 720)) * 24 * 60 * 60 * 1000,
    ).toISOString(),
    rank: 1 + Math.floor(rand() * 40),
    followers: 80 + Math.floor(rand() * 4_200),
    following: 5 + Math.floor(rand() * 220),
    activeMarkets: exposures.length,
    stats: {
      pnlUsd,
      volumeUsd,
      winRatePct,
      trades: tradesCount,
      roiPct,
      bestTradeUsd,
      avgTicketUsd:
        trades.reduce((acc, t) => acc + t.sizeUsd, 0) / Math.max(1, trades.length),
      streak,
      delta24h,
    },
    equity,
    trades,
    exposures,
    categoryMix,
  };
}
