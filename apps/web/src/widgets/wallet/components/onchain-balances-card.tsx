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
      className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-[var(--border)]"
    >
      <header className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/25">
            <Coins className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
              On-chain
            </p>
            <p className="text-[13px] font-semibold text-[var(--foreground)]">Token balances</p>
          </div>
        </div>
        {onChain?.chainId ? (
          <span className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--foreground-muted)] ring-1 ring-[var(--border)]">
            chain {onChain.chainId}
          </span>
        ) : null}
      </header>

      {!hasBalances ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center sm:px-5">
          <Sparkles className="h-5 w-5 text-[var(--foreground-muted)]" />
          <p className="text-[12px] font-medium text-[var(--foreground)]/80">No tokens detected</p>
          <p className="max-w-xs text-[11px] leading-snug text-[var(--foreground-muted)]">
            Balances appear after your wallet connects and the first network sync completes.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {nativeFormatted ? (
            <li className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <TokenChip
                symbol={nativeSymbol ?? "·"}
                tone="cyan"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[var(--foreground)]">{nativeSymbol ?? "Native"}</p>
                <p className="font-mono text-[10px] text-[var(--foreground-muted)]">Gas</p>
              </div>
              <p className="font-mono text-[12.5px] font-semibold tabular-nums text-[var(--foreground)]">
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
                  <p className="text-[12px] font-medium text-[var(--foreground)]">{b.symbol}</p>
                  <p className="font-mono text-[10px] text-[var(--foreground-muted)]">
                    {b.isNative ? "Native" : b.tokenAddress.slice(0, 6) + "…" + b.tokenAddress.slice(-4)}
                  </p>
                </div>
                <p className="font-mono text-[12.5px] font-semibold tabular-nums text-[var(--foreground)]">
                  {b.formattedBalance}{" "}
                  <span className="text-[var(--foreground-muted)]">{b.symbol}</span>
                </p>
              </li>
            ))}
        </ul>
      )}

      {onChain?.syncedAt ? (
        <footer className="border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--foreground-muted)] sm:px-5">
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
