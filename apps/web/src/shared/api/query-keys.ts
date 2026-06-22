/**
 * Hierarchical query keys — use factories only (no raw string arrays in hooks).
 *
 * Scope: `['orakly', domain, ...segments]` for bulk invalidation via prefixes.
 *
 * Conventions:
 *   - Every key starts with `queryRoot` so we can wipe the entire app cache safely.
 *   - Nested keys *contain* their parents so prefix-based invalidation cascades.
 *     e.g. invalidating `markets.detail(id)` also invalidates `odds(id)` & `quote(id, …)`.
 *   - Read-side keys are *plain hierarchical*. Mutation invalidation uses
 *     {@link marketSubtreeFilter} / {@link userSubtreeFilter} predicates so
 *     dynamic params (quote query string, etc.) still match.
 */

import type { Query } from "@tanstack/react-query";

export type HubTrendingQueryFilter = {
  cat?: string | null;
  narrative?: string | null;
  breaking?: boolean;
};

export const queryRoot = ["orakly"] as const;

/* ---------------------------------------------------------------- */
/* Markets                                                          */
/* ---------------------------------------------------------------- */

const marketsRoot = () => [...queryRoot, "markets"] as const;
const tradesRoot = () => [...queryRoot, "trades"] as const;
const portfolioRoot = () => [...queryRoot, "portfolio"] as const;
const walletRoot = () => [...queryRoot, "wallet"] as const;
const leaderboardRoot = () => [...queryRoot, "leaderboard"] as const;
const profileRoot = () => [...queryRoot, "profile"] as const;
const activityRoot = () => [...queryRoot, "activity"] as const;
const categoriesRoot = () => [...queryRoot, "categories"] as const;
const adminRoot = () => [...queryRoot, "admin"] as const;
const healthRoot = () => [...queryRoot, "health"] as const;
const referenceRoot = () => [...queryRoot, "reference"] as const;
const discoveryRoot = () => [...queryRoot, "discovery"] as const;
const hubRoot = () => [...queryRoot, "hub"] as const;

export const queryKeys = {
  hub: {
    root: hubRoot,
    attention: () => [...hubRoot(), "attention"] as const,
    stats: () => [...hubRoot(), "stats"] as const,
    narrativeWars: () => [...hubRoot(), "narrativeWars"] as const,
    conviction: (take: number) => [...hubRoot(), "conviction", take] as const,
    trending: (take: number, filter?: HubTrendingQueryFilter) =>
      [
        ...hubRoot(),
        "trending",
        take,
        filter?.cat ?? "all",
        filter?.narrative ?? "all",
        filter?.breaking ? "breaking" : "all",
      ] as const,
    topics: () => [...hubRoot(), "topics"] as const,
    categories: () => [...hubRoot(), "categories"] as const,
    suggestions: (take: number) => [...hubRoot(), "suggestions", take] as const,
  },
  markets: {
    root: marketsRoot,
    /** GET /api/v1/markets — feed / featured list (directory `lane=directory`). */
    feed: () => [...marketsRoot(), "feed"] as const,
    /**
     * Scoped hub/directory slices — `GET /api/v1/markets?scope&lane&…`.
     * Invalidate via prefix `[...marketsRoot(), "feedScoped"]`.
     */
    feedScoped: (params: {
      scope: string;
      lane: string;
      trendingBy: string;
      filter: string;
      take: number;
    }) =>
      [
        ...marketsRoot(),
        "feedScoped",
        params.scope,
        params.lane,
        params.trendingBy,
        params.filter,
        params.take,
      ] as const,
    /** GET /api/v1/markets/hub-preview — bundled hub lanes + hot topics. */
    hubPreview: () => [...marketsRoot(), "hubPreview"] as const,
    detail: (marketId: string) => [...marketsRoot(), "detail", marketId] as const,
    odds: (marketId: string) =>
      [...marketsRoot(), "detail", marketId, "odds"] as const,
    oddsHistory: (marketId: string, hours = 168) =>
      [...marketsRoot(), "detail", marketId, "oddsHistory", hours] as const,
    probability: (marketId: string) =>
      [...marketsRoot(), "detail", marketId, "probability"] as const,
    trades: (marketId: string) =>
      [...marketsRoot(), "detail", marketId, "trades"] as const,
    quote: (
      marketId: string,
      params: {
        side: "FOR" | "AGAINST";
        direction: "BUY" | "SELL";
        quantity: string;
      },
    ) => [...marketsRoot(), "detail", marketId, "quote", params] as const,
    /** L2 / synthetic order book snapshot. */
    orderBook: (marketId: string) =>
      [...marketsRoot(), "detail", marketId, "orderBook"] as const,
    /** Per-market related markets carousel. */
    related: (marketId: string) =>
      [...marketsRoot(), "detail", marketId, "related"] as const,
    /** Server-built 24h volume buckets by URL slug (synthetic + DB volume). */
    volumeWindowBySlug: (slug: string) =>
      [...marketsRoot(), "volumeWindow", slug] as const,
    /** `GET /api/v1/markets/by-slug/:slug` — detail page + trading id. */
    bySlug: (slug: string) => [...marketsRoot(), "bySlug", slug] as const,
  },

  trades: {
    root: tradesRoot,
    /** Cursor-based pages — key includes user scope for cache isolation. */
    infinite: (userScope: string) => [...tradesRoot(), "infinite", userScope] as const,
    /** Trades scoped to a single market (e.g. live tape on detail page). */
    forMarket: (marketId: string) => [...tradesRoot(), "market", marketId] as const,
  },

  portfolio: {
    root: portfolioRoot,
    byUser: (userId: string) => [...portfolioRoot(), userId] as const,
    /** Open positions slice (derivable but separately cacheable). */
    positions: (userId: string) => [...portfolioRoot(), userId, "positions"] as const,
    /** Aggregated PnL window (e.g. 24h, 7d). */
    pnl: (userId: string, windowKey: string) =>
      [...portfolioRoot(), userId, "pnl", windowKey] as const,
  },

  wallet: {
    root: walletRoot,
    /** SIWE / cookie session lookup. */
    session: () => [...walletRoot(), "session"] as const,
    /** Custodial wallet balance (USD). */
    balance: (userId: string) => [...walletRoot(), userId, "balance"] as const,
    /** On-chain balances for a specific wallet address (chain-aware). */
    onChain: (address: string, chainId: number) =>
      [...walletRoot(), "onchain", chainId, address.toLowerCase()] as const,
  },

  leaderboard: {
    root: leaderboardRoot,
    traders: (windowKey: string) =>
      [...leaderboardRoot(), "traders", windowKey] as const,
    /** `windowKey` ∈ "24h" | "7d" | "30d" | "all"; `sort` is optional. */
    list: (windowKey: string, sort?: string) =>
      [
        ...leaderboardRoot(),
        "list",
        windowKey,
        sort ?? "default",
      ] as const,
  },

  profile: {
    root: profileRoot,
    /** Trader profile keyed by lowercased EVM address. */
    byAddress: (address: string) =>
      [...profileRoot(), "address", address.toLowerCase()] as const,
    /** Achievements panel (server-side or derived). */
    achievements: (address: string) =>
      [...profileRoot(), "address", address.toLowerCase(), "achievements"] as const,
  },

  activity: {
    root: activityRoot,
    /** Cursor-paged activity ledger. */
    feed: (cursor?: string | null) =>
      [...activityRoot(), "feed", cursor ?? "head"] as const,
    /** Notifications panel. */
    notifications: (userId: string) =>
      [...activityRoot(), "notifications", userId] as const,
  },

  categories: {
    root: categoriesRoot,
    list: () => [...categoriesRoot(), "list"] as const,
  },

  /**
   * Admin namespace lives under the canonical root so a `queryRoot` reset
   * also clears admin caches. Feature-level admin hooks may continue to use
   * their own factories during migration.
   */
  admin: {
    root: adminRoot,
    me: () => [...adminRoot(), "me"] as const,
    overview: () => [...adminRoot(), "overview"] as const,
    revenue: (days: number) => [...adminRoot(), "revenue", days] as const,
    markets: (status: string, take: number) =>
      [...adminRoot(), "markets", status, take] as const,
    users: (filter?: string) =>
      [...adminRoot(), "users", filter ?? "all"] as const,
    categories: () => [...adminRoot(), "categories"] as const,
  },

  /** Spot benchmarks / fiat anchors — not prediction-market outcome prices. */
  reference: {
    root: referenceRoot,
    spotPrices: () => [...referenceRoot(), "spotPrices"] as const,
  },

  discovery: {
    root: discoveryRoot,
    /** GET /api/v1/news?q= — live headlines (Google News RSS; optional NewsAPI merge). */
    news: (q: string) => [...discoveryRoot(), "news", q] as const,
  },

  health: {
    root: healthRoot,
    ping: () => [...healthRoot(), "ping"] as const,
  },
} as const;

/* ---------------------------------------------------------------- */
/* Subtree predicates — use these for cascading invalidation         */
/* ---------------------------------------------------------------- */

/** Match every market-derived query (feed, detail, odds, quote, orderBook, related). */
export function marketSubtreeFilter(marketId: string) {
  return {
    predicate: (q: Query) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === "orakly" &&
      q.queryKey[1] === "markets" &&
      q.queryKey.includes(marketId),
  };
}

/** Match every portfolio + wallet + trades query for a single user. */
export function userSubtreeFilter(userId: string) {
  return {
    predicate: (q: Query) => {
      const k = q.queryKey;
      if (!Array.isArray(k) || k[0] !== "orakly") return false;
      const domain = k[1];
      if (domain === "portfolio") return k.includes(userId);
      if (domain === "wallet") return k.includes(userId);
      if (domain === "trades") return k.includes(userId) || k.includes("me");
      if (domain === "activity") return k.includes(userId);
      return false;
    },
  };
}

/** Match every admin-namespaced query. */
export function adminSubtreeFilter() {
  return {
    predicate: (q: Query) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === "orakly" &&
      q.queryKey[1] === "admin",
  };
}

/** Match the entire app cache (used on sign-out / hard refresh). */
export function rootSubtreeFilter() {
  return {
    predicate: (q: Query) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === "orakly",
  };
}
