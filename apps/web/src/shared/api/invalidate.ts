import type { QueryClient } from "@tanstack/react-query";
import {
  adminSubtreeFilter,
  marketSubtreeFilter,
  queryKeys,
  rootSubtreeFilter,
  userSubtreeFilter,
} from "./query-keys";

/* ---------------------------------------------------------------- */
/* User-scoped trading invalidation                                   */
/* ---------------------------------------------------------------- */

export function invalidateUserTrading(
  qc: QueryClient,
  input: { userId: string; tradesScope?: string },
) {
  const scope = input.tradesScope ?? "me";
  void qc.invalidateQueries({ queryKey: queryKeys.portfolio.byUser(input.userId) });
  void qc.invalidateQueries({ queryKey: queryKeys.trades.infinite(scope) });
}

/** Wider cascade: also clears wallet + activity for the same user. */
export function invalidateUserSubtree(qc: QueryClient, userId: string) {
  void qc.invalidateQueries(userSubtreeFilter(userId));
}

/* ---------------------------------------------------------------- */
/* Market-scoped invalidation                                         */
/* ---------------------------------------------------------------- */

export function invalidateMarketLive(
  qc: QueryClient,
  marketId: string,
  opts?: { includeFeed?: boolean },
) {
  void qc.invalidateQueries(marketSubtreeFilter(marketId));
  if (opts?.includeFeed) {
    invalidateMarketsFeed(qc);
  }
}

/** Soft refresh of hub-scoped slices + directory feed (e.g. after market creation). */
export function invalidateMarketsFeed(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: queryKeys.markets.feed() });
  void qc.invalidateQueries({
    queryKey: [...queryKeys.markets.root(), "feedScoped"],
  });
}

/* ---------------------------------------------------------------- */
/* Profile / leaderboard / activity                                   */
/* ---------------------------------------------------------------- */

export function invalidateProfile(qc: QueryClient, address: string) {
  void qc.invalidateQueries({ queryKey: queryKeys.profile.byAddress(address) });
}

export function invalidateLeaderboard(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: queryKeys.leaderboard.root() });
}

export function invalidateActivityFeed(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: queryKeys.activity.root() });
}

/* ---------------------------------------------------------------- */
/* Admin                                                             */
/* ---------------------------------------------------------------- */

export function invalidateAdminSubtree(qc: QueryClient) {
  void qc.invalidateQueries(adminSubtreeFilter());
}

/* ---------------------------------------------------------------- */
/* Heavy resets                                                      */
/* ---------------------------------------------------------------- */

/**
 * Sign-out reset: wipe every Orakly-scoped query, but keep React Query
 * itself alive (no `queryClient.clear()` so structural sharing optimisations
 * remain). Portfolio/wallet/profile data is dropped, the feed is re-fetched.
 */
export function invalidateOnSignOut(qc: QueryClient) {
  qc.removeQueries(rootSubtreeFilter());
}

/** Full reset on tenant switch / debug. */
export function clearAllAppQueries(qc: QueryClient) {
  qc.removeQueries(rootSubtreeFilter());
}
