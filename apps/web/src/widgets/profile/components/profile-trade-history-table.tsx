"use client";

import Link from "next/link";
import { History, Loader2 } from "lucide-react";
import { memo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ROUTES } from "@/shared/constants/routes";
import { fetchTraderProfileTrades } from "@/shared/api/fetchers/trader-profile";
import type { ProfileTradeRow } from "@/shared/contracts/trader-profile";
import { cn } from "@/lib/utils";
import { compactUsd, timeAgo } from "../lib/format";

const PAGE_SIZE = 20;

function StatusBadge({ status }: { status: ProfileTradeRow["status"] }) {
  const label = status === "open" ? "Open" : status === "won" ? "Won" : "Lost";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1",
        status === "won" && "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25",
        status === "lost" && "bg-rose-500/10 text-rose-200 ring-rose-400/25",
        status === "open" && "bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-[var(--hub-border)]",
      )}
    >
      {label}
    </span>
  );
}

export type ProfileTradeHistoryTableProps = {
  address: string;
  initialTrades: ReadonlyArray<ProfileTradeRow>;
  initialCursor: string | null;
};

function ProfileTradeHistoryTableInner({
  address,
  initialTrades,
  initialCursor,
}: ProfileTradeHistoryTableProps) {
  const [trades, setTrades] = useState<ProfileTradeRow[]>([...initialTrades]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);

  const loadMoreMutation = useMutation({
    mutationFn: () =>
      fetchTraderProfileTrades(address, { take: PAGE_SIZE, cursor }),
    onSuccess: (page) => {
      setTrades((current) => [...current, ...page.trades]);
      setCursor(page.nextCursor);
    },
  });

  return (
    <section
      aria-label="Trade history"
      className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-[var(--hub-border)]"
    >
      <header className="flex items-center gap-2 border-b border-[var(--hub-border)] px-4 py-3 sm:px-5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border)]">
          <History className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--hub-muted)]">
            Tape
          </p>
          <h2 className="text-[14px] font-semibold tracking-tight text-[var(--hub-fg)]">
            Trade history
          </h2>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
              <th className="px-4 py-2 sm:px-5">Date</th>
              <th className="px-2 py-2">Market</th>
              <th className="px-2 py-2">Side</th>
              <th className="px-2 py-2 text-right">Amount</th>
              <th className="px-4 py-2 pr-4 text-right sm:pr-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hub-border)]">
            {trades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--hub-muted)] sm:px-5">
                  No trades yet.
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--hub-muted)] sm:px-5">
                    {timeAgo(trade.at)}
                  </td>
                  <td className="px-2 py-2.5">
                    <Link
                      href={ROUTES.market(trade.marketSlug)}
                      className="line-clamp-2 font-medium text-[var(--hub-fg)] hover:text-[var(--hub-primary-bright)]"
                    >
                      {trade.marketTitle}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1",
                        trade.side === "YES"
                          ? "bg-cyan-500/10 text-cyan-200 ring-cyan-400/25"
                          : "bg-[var(--hub-primary-soft)] text-violet-200 ring-[var(--hub-border)]",
                      )}
                    >
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono tabular-nums text-[var(--hub-fg)]">
                    {compactUsd(trade.amountUsd)}
                  </td>
                  <td className="px-4 py-2.5 pr-4 text-right sm:pr-5">
                    <StatusBadge status={trade.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {cursor ? (
        <div className="border-t border-[var(--hub-border)] px-4 py-3 sm:px-5">
          <button
            type="button"
            disabled={loadMoreMutation.isPending}
            onClick={() => loadMoreMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--hub-bg-subtle)] px-4 py-2 text-sm font-semibold text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] disabled:opacity-60"
          >
            {loadMoreMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export const ProfileTradeHistoryTable = memo(ProfileTradeHistoryTableInner);
