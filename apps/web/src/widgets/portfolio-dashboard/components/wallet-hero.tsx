"use client";

import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { PortfolioOnChainSnapshot } from "@/shared/api/fetchers/portfolio";

function WalletHeroInner({
  availableUsd,
  lockedUsd,
  equityUsd,
  onChain,
}: {
  availableUsd: number;
  lockedUsd: number;
  equityUsd: number;
  onChain?: PortfolioOnChainSnapshot | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0a12]/92 p-4 sm:p-5"
    >
      <div className="relative">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--hub-primary-soft)] ring-1 ring-cyan-400/22">
              <Wallet className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-muted)]">
                Total balance
              </p>
              <p className="mt-0.5 font-mono text-2xl font-semibold tracking-tight text-[var(--hub-fg)] sm:text-3xl">
                {formatCompactUsd(equityUsd)}
              </p>
              <p className="mt-1 text-[11px] text-[var(--hub-muted)]">
                Cash + marked positions
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md sm:flex-1">
            <div className="rounded-xl bg-black/35 px-4 py-3 ring-1 ring-[var(--hub-border)]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--hub-muted)]">Available</p>
              <p className="mt-1 font-mono text-lg text-emerald-200/95">{formatCompactUsd(availableUsd)}</p>
            </div>
            <div className="rounded-xl bg-black/35 px-4 py-3 ring-1 ring-[var(--hub-border)]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--hub-muted)]">Locked</p>
              <p
                className={cn(
                  "mt-1 font-mono text-lg",
                  lockedUsd > 0 ? "text-amber-200/90" : "text-[var(--hub-muted)]",
                )}
              >
                {formatCompactUsd(lockedUsd)}
              </p>
            </div>
          </div>
        </div>

        {onChain && onChain.balances.length > 0 ?
          <div className="relative mt-5 border-t border-white/6 pt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--hub-muted)]">
                On-chain · chain {onChain.chainId}
              </p>
              {onChain.syncedAt ?
                <p className="font-mono text-[10px] text-[var(--hub-muted)]">
                  Synced {new Date(onChain.syncedAt).toLocaleTimeString()}
                </p>
              : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {onChain.balances.map((b) => (
                <div
                  key={`${b.tokenAddress}-${b.symbol}`}
                  className={cn(
                    "rounded-lg px-3 py-2 ring-1 ring-white/8",
                    b.isNative ? "bg-cyan-500/10" : "bg-[var(--hub-bg-subtle)]",
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--hub-muted)]">
                    {b.symbol}
                  </p>
                  <p className="mt-0.5 font-mono text-[13px] text-[var(--hub-fg)]">{b.formattedBalance}</p>
                </div>
              ))}
            </div>
          </div>
        : onChain ?
          <div className="relative mt-5 border-t border-white/6 pt-5">
            <p className="text-[11px] leading-relaxed text-[var(--hub-muted)]">
              On-chain balances for this wallet will appear after the first RPC sync (chain {onChain.chainId}
              ).
            </p>
          </div>
        : null}
      </div>
    </motion.div>
  );
}

export const WalletHero = memo(WalletHeroInner);
