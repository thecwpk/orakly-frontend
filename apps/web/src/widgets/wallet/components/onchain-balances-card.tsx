"use client";

import type { PortfolioOnChainSnapshot } from "@/shared/api/fetchers/portfolio";
import { motion } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";

function OnchainBalancesCardInner({
  onChain,
  nativeFormatted,
  nativeSymbol,
}: {
  onChain: PortfolioOnChainSnapshot | null | undefined;
  /** Live native balance from `useBalance()` — preferred over DB-cached row. */
  nativeFormatted?: string | null;
  nativeSymbol?: string | null;
}) {
  const balances = onChain?.balances ?? [];
  const hasBalances = balances.length > 0 || !!nativeFormatted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35 }}
      className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-white/[0.06]"
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/25">
            <Coins className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              On-chain
            </p>
            <p className="text-[13px] font-semibold text-white">Token balances</p>
          </div>
        </div>
        {onChain?.chainId ? (
          <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 ring-1 ring-white/[0.06]">
            chain {onChain.chainId}
          </span>
        ) : null}
      </header>

      {!hasBalances ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center sm:px-5">
          <Sparkles className="h-5 w-5 text-zinc-600" />
          <p className="text-[12px] font-medium text-zinc-300">No tokens detected</p>
          <p className="max-w-xs text-[11px] leading-snug text-zinc-500">
            Balances appear after your wallet connects and the first network sync completes.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {nativeFormatted ? (
            <li className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <TokenChip
                symbol={nativeSymbol ?? "·"}
                tone="cyan"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-white">{nativeSymbol ?? "Native"}</p>
                <p className="font-mono text-[10px] text-zinc-500">Gas</p>
              </div>
              <p className="font-mono text-[12.5px] font-semibold tabular-nums text-zinc-100">
                {nativeFormatted}
              </p>
            </li>
          ) : null}
          {balances
            .filter((b) => !b.isNative || !nativeFormatted)
            .map((b) => (
              <li
                key={`${b.tokenAddress}-${b.symbol}`}
                className="flex items-center gap-3 px-4 py-2.5 sm:px-5"
              >
                <TokenChip
                  symbol={b.symbol.slice(0, 3)}
                  tone={b.isNative ? "cyan" : "violet"}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-white">{b.symbol}</p>
                  <p className="font-mono text-[10px] text-zinc-500">
                    {b.isNative ? "Native" : b.tokenAddress.slice(0, 6) + "…" + b.tokenAddress.slice(-4)}
                  </p>
                </div>
                <p className="font-mono text-[12.5px] font-semibold tabular-nums text-zinc-100">
                  {b.formattedBalance}{" "}
                  <span className="text-zinc-500">{b.symbol}</span>
                </p>
              </li>
            ))}
        </ul>
      )}

      {onChain?.syncedAt ? (
        <footer className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-zinc-500 sm:px-5">
          Synced {new Date(onChain.syncedAt).toLocaleString()}
        </footer>
      ) : null}
    </motion.div>
  );
}

function TokenChip({
  symbol,
  tone,
}: {
  symbol: string;
  tone: "cyan" | "violet";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold uppercase ring-1",
        tone === "cyan"
          ? "bg-cyan-500/10 text-cyan-200 ring-cyan-400/25"
          : "bg-violet-500/10 text-violet-200 ring-violet-400/25",
      )}
    >
      {symbol}
    </span>
  );
}

export const OnchainBalancesCard = memo(OnchainBalancesCardInner);
