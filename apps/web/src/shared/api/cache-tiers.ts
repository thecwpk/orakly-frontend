/**
 * Cache tier presets — pick a tier per domain, then override only what differs.
 *
 * The mental model:
 *   - `staleTime`     → "how long is the cached value trusted before re-fetch is *eligible*"
 *   - `gcTime`        → "how long to keep the data in memory after the last observer unmounts"
 *   - `refetchOn*`    → "lifecycle triggers that may re-fetch a stale query"
 *   - `refetchInterval` → "polling cadence (foreground only by default)"
 *
 * Tiers form a *spectrum* from real-time to reference data; choose the one that
 * matches the *update cadence* of the underlying source, not the UI urgency.
 *
 * IMPORTANT: All `gcTime` values are clamped to a 32-bit timer ceiling so that
 * Node never warns about overflow during SSR/prerender.
 */

const TIMER_CEILING_MS = 2_147_483_647;
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const clampGc = (ms: number) => Math.min(ms, TIMER_CEILING_MS);

/** GC presets — how long the cache survives after components unmount. */
export const GC = {
  short: clampGc(5 * MINUTE),
  default: clampGc(1 * DAY),
  long: clampGc(7 * DAY),
  eternal: clampGc(30 * DAY),
} as const;

/** Stale presets — how long data is *trusted* before background refresh becomes eligible. */
export const STALE = {
  realtime: 5 * SECOND,
  fast: 15 * SECOND,
  warm: 60 * SECOND,
  cool: 5 * MINUTE,
  cold: 30 * MINUTE,
  /** Only ever invalidated explicitly (e.g. mutations, WS) */
  reference: Number.POSITIVE_INFINITY,
} as const;

/** Common refetch trigger combos. */
const TRIGGERS = {
  /** Default: never on focus, always on reconnect, no polling. */
  passive: {
    refetchOnWindowFocus: false as const,
    refetchOnReconnect: true as const,
    refetchInterval: false as const,
    refetchIntervalInBackground: false,
  },
  /** Active: also refetch on focus (for fast-changing trading data). */
  active: {
    refetchOnWindowFocus: true as const,
    refetchOnReconnect: true as const,
    refetchInterval: false as const,
    refetchIntervalInBackground: false,
  },
} as const;

/* ---------------------------------------------------------------- */
/* Named tiers                                                       */
/* ---------------------------------------------------------------- */

/**
 * `REALTIME` — values change every few seconds (orderbook, live odds).
 * Pair with WebSocket invalidation; HTTP is a *fallback snapshot*.
 */
export const REALTIME_TIER = {
  staleTime: STALE.realtime,
  gcTime: GC.long,
  ...TRIGGERS.passive,
} as const;

/**
 * `FAST` — quotes, executable prices, debounced inputs.
 * Short staleness keeps quotes fresh without spamming the server.
 */
export const FAST_TIER = {
  staleTime: STALE.fast,
  gcTime: GC.long,
  ...TRIGGERS.passive,
} as const;

/**
 * `WARM` — portfolio, balances, orders. Refresh on focus + interval.
 */
export const WARM_TIER = {
  staleTime: STALE.warm,
  gcTime: GC.eternal,
  ...TRIGGERS.active,
} as const;

/**
 * `COOL` — trade history, leaderboard, user profile.
 * Slower-changing data; observe focus but no polling.
 */
export const COOL_TIER = {
  staleTime: STALE.cool,
  gcTime: GC.eternal,
  ...TRIGGERS.passive,
} as const;

/**
 * `COLD` — categories, configuration, slow analytics.
 */
export const COLD_TIER = {
  staleTime: STALE.cold,
  gcTime: GC.eternal,
  ...TRIGGERS.passive,
} as const;

/**
 * `REFERENCE` — markets feed, semi-static lists; only WS / mutations
 * invalidate. Survives across navigations — the cache *is* the source of truth.
 */
export const REFERENCE_TIER = {
  staleTime: STALE.reference,
  gcTime: GC.eternal,
  ...TRIGGERS.passive,
} as const;

/** Optional polling cadence for portfolio reconciliation. */
export const PORTFOLIO_POLL_MS =
  process.env.NODE_ENV === "production" ? 4 * MINUTE : 3 * MINUTE;

/* ---------------------------------------------------------------- */
/* Tier shape                                                        */
/* ---------------------------------------------------------------- */

export type CacheTier = {
  staleTime: number;
  gcTime: number;
  refetchOnWindowFocus: boolean;
  refetchOnReconnect: boolean;
  refetchInterval: number | false;
  refetchIntervalInBackground: boolean;
};

export const TIERS = {
  realtime: REALTIME_TIER,
  fast: FAST_TIER,
  warm: WARM_TIER,
  cool: COOL_TIER,
  cold: COLD_TIER,
  reference: REFERENCE_TIER,
} as const satisfies Record<string, CacheTier>;

export type CacheTierName = keyof typeof TIERS;

/** Compose a tier with overrides — the result is a literal options bag for `useQuery`. */
export function withTier<O extends Partial<CacheTier> & Record<string, unknown>>(
  tier: CacheTierName,
  overrides?: O,
) {
  return { ...TIERS[tier], ...(overrides ?? {}) } as CacheTier & O;
}
