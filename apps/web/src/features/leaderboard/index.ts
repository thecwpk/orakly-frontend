/** Leaderboard feature — rankings + window/sort filters with animated movement. */

export type {
  LeaderboardSortKey,
  LeaderboardMetricTab,
  LeaderboardWindow,
  RankedTrader,
  Trader,
} from "./lib/types";

export { useLeaderboard, type UseLeaderboardResult } from "./hooks/use-leaderboard";
export { useLeaderboardMetricTab } from "./hooks/use-leaderboard-metrics";

export { LeaderboardStatsStrip } from "./components/leaderboard-stats-strip";
export { LeaderboardTable } from "./components/leaderboard-table";
export { LeaderboardAvatar } from "./components/leaderboard-avatar";
export { LeaderboardRowsSkeleton } from "./components/leaderboard-rows-skeleton";
export {
  TopTradersTable,
  WinRateTable,
  PnlTable,
  CreatorsTable,
  YourRankRow,
} from "./components/leaderboard-metric-tables";
export { TraderPodium } from "./components/trader-podium";
export { SegmentedTabs, type SegmentedOption } from "./components/segmented-tabs";
export { LeaderboardSkeleton } from "./components/leaderboard-skeleton";
export { RankDelta } from "./components/rank-delta";
