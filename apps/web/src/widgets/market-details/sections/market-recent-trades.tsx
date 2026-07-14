"use client";

import { formatCompactUsd } from "@orakly/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bscTestnetTxUrl } from "@/features/chain-trading";
import { fetchMarketTrades } from "@/shared/api/fetchers/market-trades";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function MarketRecentTrades({ marketId }: { marketId: string }) {
  const [take, setTake] = useState(10);

  const tradesQ = useQuery({
    queryKey: [...queryKeys.markets.trades(marketId), take],
    queryFn: () => fetchMarketTrades(marketId, take),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  const rows = tradesQ.data ?? [];

  return (
    <section className="rounded-2xl border border-white/[0.08] p-5">
      <h2 className="mb-4 text-[18px] font-semibold text-zinc-100">Recent Trades</h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-2 py-2 font-semibold">Time</th>
              <th className="px-2 py-2 font-semibold">Wallet</th>
              <th className="px-2 py-2 font-semibold">Side</th>
              <th className="px-2 py-2 font-semibold">Amount</th>
              <th className="px-2 py-2 font-semibold">Shares</th>
              <th className="px-2 py-2 font-semibold">Tx</th>
            </tr>
          </thead>
          <tbody>
            {tradesQ.isLoading && rows.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.05]">
                    <td colSpan={6} className="px-2 py-3">
                      <div className="h-4 animate-pulse rounded bg-zinc-800/80" />
                    </td>
                  </tr>
                ))
              : null}
            {!tradesQ.isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-10 text-center text-zinc-500">
                  No trades yet
                </td>
              </tr>
            ) : null}
            {rows.map((t) => {
              const side = t.sideOutcome ?? t.outcome;
              const wallet = t.walletAddress;
              const amount = t.amount ?? Number(t.notionalUsd);
              const shares = t.shares ?? Number(t.quantity);
              const time = t.time ?? t.executedAt;
              return (
                <tr key={t.id} className="border-b border-white/[0.05] hover:bg-white/[0.03]">
                  <td className="px-2 py-2.5 tabular-nums text-zinc-400">{timeAgo(time)}</td>
                  <td className="px-2 py-2.5">
                    {wallet ? (
                      <Link
                        href={ROUTES.traderProfile(wallet)}
                        className="font-mono text-zinc-300 hover:text-blue-300"
                      >
                        {shortenAddress(wallet)}
                      </Link>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-bold",
                        side === "YES"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-rose-500/15 text-rose-300",
                      )}
                    >
                      {side}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-200">
                    {formatCompactUsd(amount)}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-300">
                    {shares.toFixed(2)}
                  </td>
                  <td className="px-2 py-2.5">
                    {t.txHash ? (
                      <a
                        href={bscTestnetTxUrl(t.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-blue-400 hover:text-blue-300"
                        aria-label="View on BSCScan"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length >= take ? (
        <button
          type="button"
          onClick={() => setTake((n) => n + 10)}
          className="mt-4 text-[13px] font-semibold text-blue-400 hover:underline"
        >
          Load more
        </button>
      ) : null}
    </section>
  );
}
