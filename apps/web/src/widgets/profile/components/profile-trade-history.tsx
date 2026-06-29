"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Filter, History, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { memo, useMemo, useState } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { compactUsd, signedCompactUsd, timeAgo } from "../lib/format";
import type { ProfileTrade } from "../lib/types";

type TradeFilter = "all" | "wins" | "losses" | "buys" | "sells";

const FILTERS: ReadonlyArray<{ id: TradeFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "wins", label: "Wins" },
  { id: "losses", label: "Losses" },
  { id: "buys", label: "Buys" },
  { id: "sells", label: "Sells" },
];

function matches(t: ProfileTrade, f: TradeFilter): boolean {
  switch (f) {
    case "wins":
      return t.pnlUsd > 0;
    case "losses":
      return t.pnlUsd < 0;
    case "buys":
      return t.action === "BUY";
    case "sells":
      return t.action === "SELL";
    case "all":
    default:
      return true;
  }
}

export type ProfileTradeHistoryProps = {
  trades: ReadonlyArray<ProfileTrade>;
};

function ProfileTradeHistoryInner({ trades }: ProfileTradeHistoryProps) {
  const [filter, setFilter] = useState<TradeFilter>("all");

  const filtered = useMemo(
    () => trades.filter((t) => matches(t, filter)).slice(0, 30),
    [trades, filter],
  );

  const counts = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let buys = 0;
    let sells = 0;
    for (const t of trades) {
      if (t.pnlUsd > 0) wins += 1;
      else if (t.pnlUsd < 0) losses += 1;
      if (t.action === "BUY") buys += 1;
      else sells += 1;
    }
    return { all: trades.length, wins, losses, buys, sells };
  }, [trades]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="Trading history"
      className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-[var(--hub-border)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hub-border)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border)]">
            <History className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--hub-muted)]">
              Tape
            </p>
            <h2 className="text-[14px] font-semibold tracking-tight text-[var(--hub-fg)]">
              Trading history
            </h2>
          </div>
        </div>

        <div className="inline-flex items-center gap-0.5 rounded-md bg-[var(--hub-bg-subtle)] p-0.5 ring-1 ring-[var(--hub-border)]">
          <span className="px-1.5 text-[var(--hub-muted)]">
            <Filter className="h-3 w-3" aria-hidden />
          </span>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={cn(
                  "relative rounded-sm px-2 py-1 text-[10.5px] font-bold transition",
                  active
                    ? "bg-[var(--hub-card-hover)] text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)]"
                    : "text-[var(--hub-muted)] hover:text-[var(--hub-muted)]",
                )}
              >
                <span>{f.label}</span>
                <span className="ml-1 font-mono text-[9.5px] text-[var(--hub-muted)]">
                  {f.id === "all"
                    ? counts.all
                    : f.id === "wins"
                      ? counts.wins
                      : f.id === "losses"
                        ? counts.losses
                        : f.id === "buys"
                          ? counts.buys
                          : counts.sells}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[680px] border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
              <th className="px-4 py-2 sm:px-5">Market</th>
              <th className="px-2 py-2">Side</th>
              <th className="px-2 py-2">Action</th>
              <th className="px-2 py-2 text-right">Size</th>
              <th className="px-2 py-2 text-right">PnL</th>
              <th className="px-4 py-2 pr-4 text-right sm:pr-5">When</th>
            </tr>
          </thead>
          <motion.tbody layout className="divide-y divide-[var(--hub-border)] text-[var(--hub-muted)]">
            <AnimatePresence initial={false}>
              {filtered.length === 0 ? (
                <motion.tr
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={6} className="px-4 py-12 text-center text-[var(--hub-muted)] sm:px-5">
                    No trades match this filter.
                  </td>
                </motion.tr>
              ) : (
                filtered.map((t) => {
                  const win = t.pnlUsd >= 0;
                  return (
                    <motion.tr
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="group transition-colors hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-2.5 sm:px-5">
                        <Link
                          href={ROUTES.market(t.marketSlug)}
                          className="block min-w-0"
                        >
                          <span className="block truncate text-[12.5px] font-medium text-[var(--hub-fg)] group-hover:text-[var(--hub-primary-bright)]">
                            {t.marketTitle}
                          </span>
                          <span className="mt-0.5 block font-mono text-[10.5px] text-[var(--hub-muted)]">
                            {t.marketCategory} · /{t.marketSlug}
                          </span>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5">
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1",
                            t.side === "YES"
                              ? "bg-cyan-500/10 text-cyan-200 ring-cyan-400/25"
                              : "bg-[var(--hub-primary-soft)] text-violet-200 ring-[var(--hub-border)]",
                          )}
                        >
                          {t.side}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1",
                            t.action === "BUY"
                              ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25"
                              : "bg-amber-500/10 text-amber-200 ring-amber-400/25",
                          )}
                        >
                          {t.action === "BUY" ? (
                            <TrendingUp className="h-2.5 w-2.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5" />
                          )}
                          {t.action}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-[12px] tabular-nums text-[var(--hub-fg)]">
                        {compactUsd(t.sizeUsd)}
                      </td>
                      <td
                        className={cn(
                          "px-2 py-2.5 text-right font-mono text-[12.5px] font-bold tabular-nums",
                          win ? "text-emerald-200" : "text-rose-200",
                        )}
                      >
                        {signedCompactUsd(t.pnlUsd)}
                      </td>
                      <td className="px-4 py-2.5 pr-4 text-right font-mono text-[11px] text-[var(--hub-muted)] sm:pr-5">
                        {timeAgo(t.at)}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </motion.tbody>
        </table>
      </div>

      {/* Mobile compact list */}
      <ul className="divide-y divide-[var(--hub-border)] sm:hidden">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <li className="px-4 py-12 text-center text-[12px] text-[var(--hub-muted)]">
              No trades match this filter.
            </li>
          ) : (
            filtered.map((t) => {
              const win = t.pnlUsd >= 0;
              return (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="px-4 py-3"
                >
                  <Link href={ROUTES.market(t.marketSlug)} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-[var(--hub-fg)]">
                          {t.marketTitle}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-[var(--hub-muted)]">
                          <span
                            className={cn(
                              "rounded-md px-1 py-px text-[9.5px] font-bold uppercase ring-1",
                              t.side === "YES"
                                ? "bg-cyan-500/10 text-cyan-200 ring-cyan-400/25"
                                : "bg-[var(--hub-primary-soft)] text-violet-200 ring-[var(--hub-border)]",
                            )}
                          >
                            {t.side}
                          </span>
                          {t.action} · {compactUsd(t.sizeUsd)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "font-mono text-[12.5px] font-bold tabular-nums",
                            win ? "text-emerald-200" : "text-rose-200",
                          )}
                        >
                          {signedCompactUsd(t.pnlUsd)}
                        </p>
                        <p className="font-mono text-[10px] text-[var(--hub-muted)]">
                          {timeAgo(t.at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.li>
              );
            })
          )}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}

export const ProfileTradeHistory = memo(ProfileTradeHistoryInner);
