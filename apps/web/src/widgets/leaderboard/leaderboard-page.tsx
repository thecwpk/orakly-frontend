"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CreatorsTable,
  LeaderboardRowsSkeleton,
  LeaderboardStatsStrip,
  PnlTable,
  SegmentedTabs,
  TopTradersTable,
  TraderPodium,
  useLeaderboard,
  useLeaderboardMetricTab,
  WinRateTable,
  YourRankRow,
  type LeaderboardMetricTab,
  type LeaderboardSortKey,
  type LeaderboardWindow,
  type SegmentedOption,
} from "@/features/leaderboard";

const WINDOWS: ReadonlyArray<SegmentedOption<LeaderboardWindow>> = [
  { id: "24h", label: "24h", subtitle: "Daily" },
  { id: "7d", label: "Weekly", subtitle: "7d" },
  { id: "30d", label: "Monthly", subtitle: "30d" },
  { id: "all", label: "All-time", subtitle: "Career" },
];

const METRIC_TABS: ReadonlyArray<SegmentedOption<LeaderboardMetricTab>> = [
  { id: "traders", label: "Top Traders", subtitle: "Volume" },
  { id: "winRate", label: "Best Win Rate" },
  { id: "pnl", label: "Top PnL" },
  { id: "creators", label: "Top Creators" },
];

const WINDOW_LABEL: Record<LeaderboardWindow, string> = {
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
  all: "All-time",
};

function metricToSort(tab: LeaderboardMetricTab): LeaderboardSortKey {
  if (tab === "winRate") return "winRate";
  if (tab === "pnl") return "pnl";
  return "volume";
}

const METRIC_HEADING: Record<LeaderboardMetricTab, string> = {
  traders: "Top traders by volume",
  winRate: "Best win rate",
  pnl: "Top PnL",
  creators: "Top creators",
};

export function LeaderboardPage() {
  const [windowKey, setWindowKey] = useState<LeaderboardWindow>("7d");
  const [metricTab, setMetricTab] = useState<LeaderboardMetricTab>("traders");

  const sortKey = metricToSort(metricTab);
  const isTraderTab = metricTab !== "creators";

  const { podium, totals, flux } = useLeaderboard({
    window: windowKey,
    sort: sortKey,
  });

  const {
    isLoading,
    displayTraderRows,
    displayCreatorRows,
    yourTraderRank,
    yourCreatorRank,
    connectedAddress,
  } = useLeaderboardMetricTab(metricTab, windowKey);

  const metricDescription = useMemo(() => {
    switch (metricTab) {
      case "traders":
        return "Ranked by notional volume over rolling time windows.";
      case "winRate":
        return "Ranked by win rate with a minimum of 5 trades.";
      case "pnl":
        return "Ranked by realized PnL across resolved positions.";
      case "creators":
        return "Ranked by approved markets, volume generated, and fees earned.";
    }
  }, [metricTab]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col pb-s64 pt-s48 md:pt-s56">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-b border-white/[0.06] pb-r24"
      >
        <div className="flex flex-wrap items-end justify-between gap-r16">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
              <Trophy className="h-3 w-3" />
              Hall of conviction
            </p>
            <h1 className="mt-1.5 text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
              {METRIC_HEADING[metricTab]}
            </h1>
            <p className="mt-1.5 max-w-xl text-[12.5px] text-zinc-500">
              {metricDescription} Click any address to open their public profile.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-r16">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200 ring-1 ring-emerald-400/25">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.45)]"
                aria-hidden
              />
              Live tape
            </span>
            {isTraderTab ? (
              <span className="hidden items-center gap-1.5 rounded-md bg-violet-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200 ring-1 ring-violet-400/25 sm:inline-flex">
                <Sparkles className="h-3 w-3" />
                {WINDOW_LABEL[windowKey]}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-r24 space-y-r16">
          <SegmentedTabs
            ariaLabel="Leaderboard metric"
            options={METRIC_TABS}
            value={metricTab}
            onChange={setMetricTab}
            size="tabs"
          />
          {isTraderTab ? (
            <SegmentedTabs
              ariaLabel="Time window"
              options={WINDOWS}
              value={windowKey}
              onChange={setWindowKey}
              size="tabs"
            />
          ) : null}
        </div>
      </motion.header>

      {isTraderTab ? (
        <>
          <LeaderboardStatsStrip
            className="mb-r24 mt-s40"
            totalVolumeUsd={totals.totalVolumeUsd}
            totalPnlUsd={totals.totalPnlUsd}
            averageWinRatePct={totals.averageWinRate}
            totalTrades={totals.totalTrades}
            flux={flux}
            windowLabel={WINDOW_LABEL[windowKey]}
          />

          <section aria-label="Podium" className="mb-s48 space-y-r16">
            <header className="flex items-baseline justify-between gap-r16">
              <h2 className="text-[13px] font-semibold tracking-tight text-zinc-200">
                Podium · top 3
              </h2>
              <p className="text-[10.5px] text-zinc-500">
                Ranks update on every metric switch · animated transitions show movement.
              </p>
            </header>
            <TraderPodium podium={podium} />
          </section>
        </>
      ) : null}

      <section aria-label="Full leaderboard" className="space-y-r16">
        <header className="flex items-baseline justify-between gap-r16">
          <h2 className="text-[13px] font-semibold tracking-tight text-zinc-200">
            {metricTab === "creators"
              ? `Top creators · ${displayCreatorRows.length} shown`
              : `Full ranking · top ${displayTraderRows.length}`}
          </h2>
        </header>

        {isLoading ? (
          <LeaderboardRowsSkeleton rows={10} />
        ) : metricTab === "traders" ? (
          <TopTradersTable rows={displayTraderRows} />
        ) : metricTab === "winRate" ? (
          <WinRateTable rows={displayTraderRows} />
        ) : metricTab === "pnl" ? (
          <PnlTable rows={displayTraderRows} />
        ) : (
          <CreatorsTable rows={displayCreatorRows} />
        )}

        {connectedAddress ? (
          metricTab === "creators" ? (
            <YourRankRow
              tab="creators"
              address={connectedAddress}
              row={yourCreatorRank.row}
              rank={yourCreatorRank.rank}
            />
          ) : (
            <YourRankRow
              tab={metricTab}
              address={connectedAddress}
              row={yourTraderRank.row}
              rank={yourTraderRank.rank}
            />
          )
        ) : null}
      </section>
    </main>
  );
}
