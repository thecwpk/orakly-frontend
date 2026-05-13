"use client";

import type { TradeRow } from "@/shared/api/fetchers/trades";
import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { parseUsd } from "../lib/portfolio-metrics";

function TradesHistoryInner({
  trades,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  trades: TradeRow[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="surface-terminal-solid overflow-hidden rounded-md">
      <div className="border-b border-white/[0.06] px-r16 py-r16 sm:px-r20">
        <p className="label-terminal">Fills</p>
        <p className="mt-r4 font-mono text-[10px] tabular-nums text-zinc-500">
          Newest first · optimistic rows dim until confirmed
        </p>
      </div>
      <div className="max-h-[min(52vh,420px)] overflow-x-auto overflow-y-auto overscroll-contain scrollbar-terminal">
        <table className="w-full min-w-[600px] border-collapse text-left text-[11px]">
          <thead className="sticky top-0 z-[1] bg-[#06060b]/98 backdrop-blur-sm">
            <tr className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
              <th className="px-3 py-2 font-medium sm:px-3.5">Time</th>
              <th className="px-2 py-2 font-medium">Side</th>
              <th className="px-2 py-2 font-medium">Out</th>
              <th className="px-2 py-2 font-medium">Qty</th>
              <th className="px-2 py-2 font-medium">Px</th>
              <th className="px-3 py-2 font-medium sm:px-3.5">Notional</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {trades.map((t) => {
              const pend = t.optimistic || t.price === "pending";
              const sideBuy = t.side === "BUY";
              return (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    "font-mono text-zinc-400",
                    pend && "opacity-60",
                  )}
                >
                  <td className="whitespace-nowrap px-3 py-1.5 text-zinc-600 sm:px-3.5 sm:py-2">
                    {pend ? "…" : new Date(t.executedAt).toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 sm:py-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-px text-[10px] font-bold ring-1",
                        sideBuy ?
                          "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25"
                        : "bg-rose-500/15 text-rose-100 ring-rose-500/25",
                      )}
                    >
                      {t.side}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 sm:py-2">{t.outcome}</td>
                  <td className="px-2 py-1.5 sm:py-2">{t.quantity}</td>
                  <td className="px-2 py-1.5 sm:py-2">{pend ? "…" : t.price}</td>
                  <td className="px-3 py-1.5 sm:px-3.5 sm:py-2">{pend ? "…" : formatCompactUsd(parseUsd(t.notionalUsd))}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {!trades.length ?
          <p className="px-4 py-8 text-center text-[12px] text-zinc-600">No trades yet.</p>
        : null}
      </div>
      {hasNextPage ?
        <div className="border-t border-white/[0.06] p-2">
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-white/[0.06] py-2 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/[0.08] transition hover:bg-white/[0.09] disabled:opacity-50"
          >
            {isFetchingNextPage ?
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading
              </>
            : "Load more"}
          </button>
        </div>
      : null}
    </div>
  );
}

export const TradesHistory = memo(TradesHistoryInner);
