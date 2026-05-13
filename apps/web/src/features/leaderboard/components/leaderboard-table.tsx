"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ChevronDown } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { Sparkline } from "@/shared/ui";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { compactUsd, shortAddress, signedCompactUsd, signedPct } from "../lib/format";
import type { LeaderboardSortKey, RankedTrader } from "../lib/types";
import { RankDelta } from "./rank-delta";

export type LeaderboardTableProps = {
  rows: ReadonlyArray<RankedTrader>;
  sort: LeaderboardSortKey;
  onSortChange: (next: LeaderboardSortKey) => void;
  /** When true, the rank-delta column always renders (e.g. on /leaderboard). */
  showDelta?: boolean;
};

type Col = {
  id: "rank" | "trader" | "pnl" | "roi" | "volume" | "winRate" | "trades" | "spark";
  label: string;
  align?: "left" | "right";
  sortKey?: LeaderboardSortKey;
  className?: string;
};

const COLUMNS: ReadonlyArray<Col> = [
  { id: "rank", label: "#", className: "w-[68px]" },
  { id: "trader", label: "Trader" },
  { id: "pnl", label: "PnL", align: "right", sortKey: "pnl" },
  { id: "roi", label: "ROI", align: "right", sortKey: "roi" },
  { id: "volume", label: "Volume", align: "right", sortKey: "volume" },
  { id: "winRate", label: "Win", align: "right", sortKey: "winRate" },
  { id: "trades", label: "Trades", align: "right", className: "hidden md:table-cell" },
  { id: "spark", label: "Trend", align: "right", className: "hidden lg:table-cell" },
];

function LeaderboardTableInner({
  rows,
  sort,
  onSortChange,
  showDelta = true,
}: LeaderboardTableProps) {
  return (
    <div className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-white/[0.06]">
      {/* Desktop dense table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-[12.5px]">
            <thead className="sticky top-0 z-[1] bg-[#08080d]/85 backdrop-blur-md">
              <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {COLUMNS.map((col) => {
                  const isSortable = !!col.sortKey;
                  const isActive = isSortable && col.sortKey === sort;
                  return (
                    <th
                      key={col.id}
                      scope="col"
                      className={cn(
                        "px-3 py-2.5 sm:px-4",
                        col.align === "right" && "text-right",
                        col.className,
                      )}
                      aria-sort={isActive ? "descending" : isSortable ? "none" : undefined}
                    >
                      {isSortable ? (
                        <button
                          type="button"
                          onClick={() => onSortChange(col.sortKey!)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition",
                            col.align === "right" && "ml-auto",
                            isActive
                              ? "bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-400/25"
                              : "text-zinc-500 hover:text-zinc-200",
                          )}
                        >
                          {col.label}
                          {isActive ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3 opacity-30" />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <motion.tbody layout className="divide-y divide-white/[0.04] text-zinc-300">
              <AnimatePresence initial={false}>
                {rows.map((trader) => (
                  <DesktopRow
                    key={trader.address}
                    trader={trader}
                    showDelta={showDelta}
                  />
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* Mobile compact card list */}
      <ul className="divide-y divide-white/[0.04] md:hidden">
        <AnimatePresence initial={false}>
          {rows.map((trader) => (
            <MobileRow key={trader.address} trader={trader} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

const DesktopRow = memo(function DesktopRow({
  trader,
  showDelta,
}: {
  trader: RankedTrader;
  showDelta: boolean;
}) {
  const profitable = trader.pnlUsd >= 0;

  return (
    <motion.tr
      layout
      layoutId={`row-${trader.address}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        layout: { type: "spring", stiffness: 480, damping: 36 },
        duration: 0.18,
      }}
      className="group transition-colors hover:bg-white/[0.025]"
    >
      <td className="px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-[10.5px] font-bold ring-1",
              trader.rank <= 3
                ? "bg-amber-500/10 text-amber-200 ring-amber-400/25"
                : "bg-white/[0.04] text-zinc-300 ring-white/[0.08]",
            )}
          >
            {trader.rank}
          </span>
          {showDelta && trader.rankDelta !== 0 ? (
            <RankDelta delta={trader.rankDelta} size="xs" />
          ) : null}
        </div>
      </td>
      <td className="px-3 py-2.5 sm:px-4">
        <Link
          href={ROUTES.traderProfile(trader.address)}
          className="flex min-w-0 items-center gap-2.5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/30 font-mono text-[10px] font-bold uppercase text-white ring-1 ring-white/15">
            {trader.address.replace(/^0x/, "").slice(0, 2)}
          </span>
          <div className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-zinc-100 group-hover:text-cyan-200">
              {trader.alias}
            </span>
            <span className="block truncate font-mono text-[10.5px] text-zinc-500">
              {shortAddress(trader.address)}
            </span>
          </div>
        </Link>
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right font-mono tabular-nums sm:px-4",
          profitable ? "text-emerald-200" : "text-rose-200",
        )}
      >
        <div className="flex flex-col items-end leading-tight">
          <span className="text-[12.5px] font-bold">
            {signedCompactUsd(trader.pnlUsd)}
          </span>
          <span className="text-[10px] text-zinc-500">{signedPct(trader.delta24h, 2)} 24h</span>
        </div>
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums sm:px-4",
          trader.roiPct >= 0 ? "text-cyan-200" : "text-rose-200",
        )}
      >
        {signedPct(trader.roiPct)}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums text-zinc-200 sm:px-4">
        {compactUsd(trader.volumeUsd)}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-[12.5px] tabular-nums sm:px-4">
        <WinRateBar pct={trader.winRatePct} />
      </td>
      <td className="hidden px-3 py-2.5 text-right font-mono text-[12px] tabular-nums text-zinc-400 sm:px-4 md:table-cell">
        {trader.trades.toLocaleString()}
      </td>
      <td className="hidden px-3 py-2 sm:px-4 lg:table-cell">
        <div className="flex justify-end">
          <Sparkline
            data={trader.spark}
            tone={profitable ? "emerald" : "rose"}
            width={92}
            height={26}
            strokeWidth={1.4}
            ariaLabel={`${trader.alias} performance`}
          />
        </div>
      </td>
    </motion.tr>
  );
});

const MobileRow = memo(function MobileRow({ trader }: { trader: RankedTrader }) {
  const profitable = trader.pnlUsd >= 0;
  return (
    <motion.li
      layout
      layoutId={`mrow-${trader.address}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        layout: { type: "spring", stiffness: 460, damping: 36 },
        duration: 0.18,
      }}
      className="px-4 py-3"
    >
      <Link href={ROUTES.traderProfile(trader.address)} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-[10.5px] font-bold ring-1",
                trader.rank <= 3
                  ? "bg-amber-500/10 text-amber-200 ring-amber-400/25"
                  : "bg-white/[0.04] text-zinc-300 ring-white/[0.08]",
              )}
            >
              {trader.rank}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-zinc-100">
                {trader.alias}
              </p>
              <p className="truncate font-mono text-[10.5px] text-zinc-500">
                {shortAddress(trader.address)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "font-mono text-[13px] font-bold tabular-nums leading-tight",
                profitable ? "text-emerald-200" : "text-rose-200",
              )}
            >
              {signedCompactUsd(trader.pnlUsd)}
            </p>
            <p
              className={cn(
                "font-mono text-[10.5px] tabular-nums",
                trader.roiPct >= 0 ? "text-cyan-200" : "text-rose-200",
              )}
            >
              {signedPct(trader.roiPct)} ROI
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[10.5px] text-zinc-500">
            <span>
              Vol{" "}
              <span className="font-mono font-bold tabular-nums text-zinc-300">
                {compactUsd(trader.volumeUsd)}
              </span>
            </span>
            <span>
              Win{" "}
              <span className="font-mono font-bold tabular-nums text-zinc-200">
                {trader.winRatePct.toFixed(0)}%
              </span>
            </span>
            {trader.rankDelta !== 0 ? (
              <RankDelta delta={trader.rankDelta} size="xs" />
            ) : null}
          </div>
          <Sparkline
            data={trader.spark}
            tone={profitable ? "emerald" : "rose"}
            width={68}
            height={20}
            strokeWidth={1.3}
            showLastDot={false}
          />
        </div>
      </Link>
    </motion.li>
  );
});

function WinRateBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="ml-auto flex w-[112px] items-center gap-1.5">
      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]"
        aria-hidden
      >
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            clamped >= 65
              ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
              : clamped >= 50
                ? "bg-gradient-to-r from-cyan-400 to-violet-400"
                : "bg-gradient-to-r from-rose-400 to-amber-400",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
        />
      </div>
      <span className="w-9 text-right text-zinc-200">{clamped.toFixed(0)}%</span>
    </div>
  );
}

export const LeaderboardTable = memo(LeaderboardTableInner);
