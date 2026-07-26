"use client";

import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  Loader2,
  Receipt,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { compactUsd, fullUsd, timeAgo } from "../lib/format";
import type { WalletTxKind, WalletTxRow } from "../lib/build-transactions";

type FilterId = "ALL" | "DEPOSIT" | "WITHDRAW" | "TRADE";

const FILTERS: ReadonlyArray<{ id: FilterId; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "DEPOSIT", label: "Deposits" },
  { id: "WITHDRAW", label: "Withdrawals" },
  { id: "TRADE", label: "Trades" },
];

const KIND_META: Record<
  WalletTxKind,
  { icon: LucideIcon; tone: string; label: string }
> = {
  DEPOSIT: {
    icon: ArrowDownToLine,
    tone: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
    label: "Deposit",
  },
  WITHDRAW: {
    icon: ArrowUpFromLine,
    tone: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    label: "Withdraw",
  },
  TRADE_BUY: {
    icon: TrendingUp,
    tone: "bg-cyan-500/15 text-cyan-200 ring-cyan-400/30",
    label: "Trade · Buy",
  },
  TRADE_SELL: {
    icon: TrendingDown,
    tone: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
    label: "Trade · Sell",
  },
};

function matchesFilter(row: WalletTxRow, filter: FilterId): boolean {
  if (filter === "ALL") return true;
  if (filter === "DEPOSIT") return row.kind === "DEPOSIT";
  if (filter === "WITHDRAW") return row.kind === "WITHDRAW";
  return row.kind === "TRADE_BUY" || row.kind === "TRADE_SELL";
}

function WalletTransactionsInner({
  rows,
  isLoading,
  isFetchingMore,
  hasNextPage,
  onLoadMore,
}: {
  rows: WalletTxRow[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
}) {
  const [filter, setFilter] = useState<FilterId>("ALL");
  const filtered = rows.filter((r) => matchesFilter(r, filter));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.35 }}
      className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-[var(--border)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/25">
            <Receipt className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
              History
            </p>
            <p className="text-[13px] font-semibold text-[var(--foreground)]">Transactions</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-0.5 rounded-md bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] p-0.5 ring-1 ring-[var(--border)]">
          <span className="px-1.5 text-[var(--foreground-muted)]">
            <Filter className="h-3 w-3" aria-hidden />
          </span>
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={isActive}
                className={cn(
                  "rounded-sm px-2 py-1 text-[10.5px] font-bold transition",
                  isActive
                    ? "bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] text-[var(--foreground)] ring-1 ring-[var(--border)]"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]/80",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState filter={filter} isLoading={isLoading} />
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                <th className="px-4 py-2 sm:px-5">Type</th>
                <th className="px-2 py-2">Reference</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-2 py-2 text-right">Status</th>
                <th className="px-4 py-2 pr-4 text-right sm:pr-5">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((tx) => {
                const meta = KIND_META[tx.kind];
                const Icon = meta.icon;
                const positive = tx.amountUsd >= 0;
                return (
                  <tr
                    key={tx.id}
                    className={cn(
                      "transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]",
                      tx.status === "PENDING" && "opacity-70",
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 sm:px-5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ring-1",
                          meta.tone,
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="font-mono text-[11px] text-[var(--foreground-muted)]">
                        {tx.label}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-2 py-2.5 text-right font-mono tabular-nums",
                        positive ? "text-emerald-200" : "text-rose-200",
                      )}
                    >
                      <span className="text-[12.5px] font-semibold">
                        {positive ? "+" : "−"}
                        {compactUsd(Math.abs(tx.amountUsd))}
                      </span>
                      <span className="ml-1 hidden text-[10px] text-[var(--foreground-muted)] sm:inline">
                        {fullUsd(Math.abs(tx.amountUsd))}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <StatusPill status={tx.status} />
                    </td>
                    <td className="px-4 py-2.5 pr-4 text-right font-mono text-[11px] text-[var(--foreground-muted)] sm:pr-5">
                      {timeAgo(tx.at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {hasNextPage ? (
        <div className="border-t border-[var(--border)] p-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] py-2.5 text-[12.5px] font-semibold text-[var(--foreground)] ring-1 ring-[var(--border)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] disabled:opacity-50"
          >
            {isFetchingMore ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}

function StatusPill({ status }: { status: WalletTxRow["status"] }) {
  if (status === "CONFIRMED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-400/25">
        <span
          className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.45)]"
          aria-hidden
        />
        Confirmed
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-200 ring-1 ring-amber-400/25">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-200 ring-1 ring-rose-400/25">
      Failed
    </span>
  );
}

function EmptyState({
  filter,
  isLoading,
}: {
  filter: FilterId;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-1 px-4 py-4 sm:px-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2"
          >
            <div className="h-5 w-20 rounded-md bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] skeleton-shimmer" />
            <div className="h-4 flex-1 rounded bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] skeleton-shimmer" />
            <div className="h-4 w-16 rounded bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] skeleton-shimmer" />
            <div className="h-4 w-12 rounded bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }
  const label =
    filter === "DEPOSIT"
      ? "deposits"
      : filter === "WITHDRAW"
        ? "withdrawals"
        : filter === "TRADE"
          ? "trades"
          : "transactions";
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center sm:px-5">
      <Receipt className="h-5 w-5 text-[var(--foreground-muted)]" />
      <p className="text-[12px] font-medium text-[var(--foreground)]/80">
        No {label} yet
      </p>
      <p className="max-w-xs text-[11px] leading-snug text-[var(--foreground-muted)]">
        Your wallet activity will appear here as it lands on Orakly.
      </p>
    </div>
  );
}

export const WalletTransactions = memo(WalletTransactionsInner);
