/** Leaderboard feature — rankings + window/sort filters with animated movement. */

export type {
  LeaderboardSortKey,
  LeaderboardWindow,
  RankedTrader,
  Trader,
} from "./lib/types";

export { useLeaderboard, type UseLeaderboardResult } from "./hooks/use-leaderboard";

export { LeaderboardStatsStrip } from "./components/leaderboard-stats-strip";
export { LeaderboardTable } from "./components/leaderboard-table";
export { TraderPodium } from "./components/trader-podium";
export { SegmentedTabs, type SegmentedOption } from "./components/segmented-tabs";
export { LeaderboardSkeleton } from "./components/leaderboard-skeleton";
export { RankDelta } from "./components/rank-delta";
