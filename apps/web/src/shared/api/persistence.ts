"use client";

/**
 * Selective query cache persistence — a *lightweight* alternative to
 * `@tanstack/react-query-persist-client` that:
 *
 *   - Persists only the keys you opt in to (no full cache snapshots).
 *   - Stores a `{ data, updatedAt, version }` envelope so we can drop stale
 *     entries on hydrate without polluting the cache.
 *   - Is SSR-safe: every helper bails out when `window` is undefined.
 *
 * Use this for read-heavy *reference* data that survives across sessions
 * (markets feed, categories) so users open the app to instantly-rendered
 * content even on slow networks.
 */

import type { QueryCache, QueryClient, QueryKey } from "@tanstack/react-query";

const STORAGE_PREFIX = "orakly:rq:";
const VERSION = 1;

type Envelope<T> = {
  v: number;
  /** ms since epoch when persisted. */
  t: number;
  data: T;
};

const safeKey = (key: QueryKey) => `${STORAGE_PREFIX}${JSON.stringify(key)}`;

const isClient = () => typeof window !== "undefined";

/* ---------------------------------------------------------------- */
/* Hydrate                                                           */
/* ---------------------------------------------------------------- */

export type HydrateOptions = {
  /** Maximum age (ms) before a persisted entry is discarded. Default = 7d. */
  maxAgeMs?: number;
};

/**
 * Hydrate a single query from localStorage if a fresh-enough envelope exists.
 * Returns `true` when data was successfully restored.
 */
export function hydratePersistedQuery<T>(
  qc: QueryClient,
  key: QueryKey,
  { maxAgeMs = 7 * 24 * 60 * 60 * 1000 }: HydrateOptions = {},
): boolean {
  if (!isClient()) return false;

  try {
    const raw = window.localStorage.getItem(safeKey(key));
    if (!raw) return false;

    const env = JSON.parse(raw) as Envelope<T>;
    if (env.v !== VERSION) return false;
    if (Date.now() - env.t > maxAgeMs) return false;

    qc.setQueryData<T>(key, env.data, {
      updatedAt: env.t,
    });
    return true;
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------- */
/* Subscribe + persist                                               */
/* ---------------------------------------------------------------- */

export type PersistRule = {
  /** The query key to watch. Persistence is keyed off `JSON.stringify(key)`. */
  key: QueryKey;
  /** Filter predicate — return `false` to skip a particular update. */
  shouldPersist?: (data: unknown) => boolean;
};

const matchesRule = (cacheKey: QueryKey, ruleKey: QueryKey) =>
  JSON.stringify(cacheKey) === JSON.stringify(ruleKey);

/**
 * Subscribe to the `QueryCache` and persist matching entries to localStorage
 * whenever their data changes. Returns an unsubscribe.
 *
 * Mount this once at app boot (e.g. inside `AppProviders`) — running it
 * multiple times is harmless but wasteful.
 */
export function subscribePersistedQueries(
  qc: QueryClient,
  rules: ReadonlyArray<PersistRule>,
): () => void {
  if (!isClient()) return () => {};

  const cache: QueryCache = qc.getQueryCache();

  const persist = (key: QueryKey, data: unknown) => {
    try {
      const env: Envelope<unknown> = { v: VERSION, t: Date.now(), data };
      window.localStorage.setItem(safeKey(key), JSON.stringify(env));
    } catch {
      // Ignore quota / serialization errors; the cache stays in memory.
    }
  };

  return cache.subscribe((event) => {
    if (event.type !== "updated") return;
    const { query } = event;

    const matched = rules.find((r) => matchesRule(query.queryKey, r.key));
    if (!matched) return;

    const data = query.state.data;
    if (data === undefined) return;
    if (matched.shouldPersist && !matched.shouldPersist(data)) return;

    persist(matched.key, data);
  });
}

/* ---------------------------------------------------------------- */
/* Default rule set                                                  */
/* ---------------------------------------------------------------- */

import { queryKeys } from "./query-keys";

/**
 * Default persistence rules — opt-in: read-heavy reference data only.
 * Add more entries here when you have new offline-first surfaces.
 */
export const DEFAULT_PERSIST_RULES: ReadonlyArray<PersistRule> = [
  {
    key: queryKeys.markets.feed(),
    shouldPersist: (data) => Array.isArray(data) && data.length > 0,
  },
  {
    key: queryKeys.categories.list(),
    shouldPersist: (data) => Array.isArray(data) && data.length > 0,
  },
];

/**
 * One-shot bootstrap: hydrate every default-persisted key from localStorage,
 * then start subscribing for future cache writes. Call once at app boot.
 */
export function bootstrapQueryPersistence(qc: QueryClient): () => void {
  for (const rule of DEFAULT_PERSIST_RULES) {
    hydratePersistedQuery(qc, rule.key);
  }
  return subscribePersistedQueries(qc, DEFAULT_PERSIST_RULES);
}
