/**
 * Per-domain cache strategy — derived from named tiers in `./cache-tiers`.
 *
 * If you find yourself reaching for a one-off `staleTime`, ask first whether
 * the domain belongs to an existing tier; only override when the domain has
 * truly different update characteristics from its tier.
 */

import {
  COLD_TIER,
  COOL_TIER,
  FAST_TIER,
  PORTFOLIO_POLL_MS,
  REFERENCE_TIER,
  WARM_TIER,
} from "./cache-tiers";

export const CACHE_POLICY = {
  /** Lists / reference: rarely stale on its own — refresh via invalidation or realtime. */
  marketsFeed: {
    ...REFERENCE_TIER,
  },

  /** Odds / liquidity: WS pushes invalidate; HTTP is fallback snapshot. */
  marketOdds: {
    ...WARM_TIER,
    refetchOnWindowFocus: false as const,
    refetchInterval: false as const,
  },

  /** Executable quote: short-lived; debounced key churn in hook layer. */
  marketQuote: {
    ...FAST_TIER,
  },

  /** Custodial portfolio: reconcile with server + realtime ticks. */
  portfolio: {
    ...WARM_TIER,
    staleTime: 45_000,
    refetchInterval: PORTFOLIO_POLL_MS,
  },

  /** Trade history — infinite query pages stay cached until explicit invalidation / prune. */
  tradesInfinite: {
    ...WARM_TIER,
    staleTime: 90_000,
    refetchOnWindowFocus: false as const,
  },

  /** Leaderboard / rankings — slow churn, refresh on focus. */
  leaderboard: {
    ...COOL_TIER,
  },

  /** Public profile pages — refresh on focus, never poll. */
  profile: {
    ...COOL_TIER,
  },

  /** Activity ledger pages — slow background; realtime adds head rows. */
  activity: {
    ...COOL_TIER,
  },

  /** Wallet session / SIWE — ~30s staleness; refresh on focus. */
  walletSession: {
    ...WARM_TIER,
    staleTime: 30_000,
  },

  /** Categories / market taxonomy — rarely changes. */
  categories: {
    ...COLD_TIER,
  },

  /** Admin overview — moderate freshness, polled lightly. */
  adminOverview: {
    ...WARM_TIER,
    staleTime: 15_000,
    refetchInterval: 30_000,
  },
} as const;

export type CachePolicyKey = keyof typeof CACHE_POLICY;

/** Re-export tier helpers for convenience at the policy boundary. */
export {
  TIERS,
  withTier,
  type CacheTier,
  type CacheTierName,
} from "./cache-tiers";
