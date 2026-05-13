"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";
import { useState } from "react";
import {
  LeaderboardStatsStrip,
  LeaderboardTable,
  SegmentedTabs,
  TraderPodium,
  useLeaderboard,
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

const SORTS: ReadonlyArray<SegmentedOption<LeaderboardSortKey>> = [
  { id: "pnl", label: "PnL" },
  { id: "roi", label: "ROI" },
  { id: "volume", label: "Volume" },
  { id: "winRate", label: "Win" },
];

const WINDOW_LABEL: Record<LeaderboardWindow, string> = {
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
  all: "All-time",
};

export function LeaderboardPage() {
  const [windowKey, setWindowKey] = useState<LeaderboardWindow>("7d");
  const [sortKey, setSortKey] = useState<LeaderboardSortKey>("pnl");

  const { podium, rest, totals, flux } = useLeaderboard({
    window: windowKey,
    sort: sortKey,
  });

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
              Top traders leaderboard
            </h1>
            <p className="mt-1.5 max-w-xl text-[12.5px] text-zinc-500">
              Ranked by realized PnL, ROI, volume, or win rate over rolling time
              windows. Click any trader to open their public profile.
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
            <span className="hidden items-center gap-1.5 rounded-md bg-violet-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200 ring-1 ring-violet-400/25 sm:inline-flex">
              <Sparkles className="h-3 w-3" />
              {WINDOW_LABEL[windowKey]}
            </span>
          </div>
        </div>

        <div className="mt-r24 flex flex-wrap items-center gap-r16 sm:gap-r24">
          <SegmentedTabs
            ariaLabel="Time window"
            options={WINDOWS}
            value={windowKey}
            onChange={setWindowKey}
            size="tabs"
          />
          <SegmentedTabs
            ariaLabel="Sort metric"
            options={SORTS}
            value={sortKey}
            onChange={setSortKey}
          />
        </div>
      </motion.header>

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

      <section aria-label="Full leaderboard" className="space-y-r16">
        <header className="flex items-baseline justify-between gap-r16">
          <h2 className="text-[13px] font-semibold tracking-tight text-zinc-200">
            Full ranking · {rest.length + podium.length} traders
          </h2>
          <p className="text-[10.5px] text-zinc-500">
            Tap any column header to sort.
          </p>
        </header>
        <LeaderboardTable rows={rest} sort={sortKey} onSortChange={setSortKey} />
      </section>
    </main>
  );
}
