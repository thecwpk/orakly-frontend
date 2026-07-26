"use client";

import { motion } from "framer-motion";
import { Coins, ExternalLink } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import type { ChainMarketPosition } from "@/features/chain-trading/hooks/use-chain-wallet-positions";
import { ROUTES } from "@/shared/constants/routes";
import { compactUsd } from "../lib/format";
import { cn } from "@/lib/utils";

function ChainPositionsCardInner({
  positions,
  isLoading,
}: {
  positions: ChainMarketPosition[];
  isLoading?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-[var(--border)]"
    >
      <header className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/25">
            <Coins className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
              Positions
            </p>
            <p className="text-[13px] font-semibold text-[var(--foreground)]">On-chain holdings</p>
          </div>
        </div>
        <span className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--foreground-muted)] ring-1 ring-[var(--border)]">
          BSC testnet
        </span>
      </header>

      {isLoading && positions.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12px] text-[var(--foreground-muted)] sm:px-5">
          Loading on-chain positions…
        </div>
      ) : positions.length === 0 ? (
        <div className="px-4 py-8 text-center sm:px-5">
          <p className="text-[12px] font-medium text-[var(--foreground)]/80">No open positions</p>
          <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">
            Buy YES or NO shares on any deployed market — balances read from your wallet.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {positions.map((p) => (
            <li key={p.marketId} className="px-4 py-2.5 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={ROUTES.market(p.slug)}
                    className="line-clamp-2 text-[12.5px] font-medium text-[var(--foreground)] hover:text-cyan-200"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-1 font-mono text-[10.5px] text-[var(--foreground-muted)]">
                    {p.yesShares > 0 ? `${p.yesShares.toFixed(2)} YES` : null}
                    {p.yesShares > 0 && p.noShares > 0 ? " · " : null}
                    {p.noShares > 0 ? `${p.noShares.toFixed(2)} NO` : null}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-[12px] font-semibold tabular-nums text-cyan-100">
                  {compactUsd(p.valueUsd)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer className="border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--foreground-muted)] sm:px-5">
        <a
          href="https://testnet.bscscan.com"
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex items-center gap-1 text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]",
          )}
        >
          Verify on BscScan
          <ExternalLink className="h-3 w-3" />
        </a>
      </footer>
    </motion.section>
  );
}

export const ChainPositionsCard = memo(ChainPositionsCardInner);
