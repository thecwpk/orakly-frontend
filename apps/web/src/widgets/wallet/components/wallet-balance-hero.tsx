"use client";

import { motion } from "framer-motion";
import { ArrowDownToLine, ExternalLink, RefreshCw, Wallet } from "lucide-react";
import { memo } from "react";
import { fullUsd, compactUsd } from "../lib/format";
import { cn } from "@/lib/utils";

function Cell({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "emerald" | "violet" | "cyan" | "amber";
  hint?: string;
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-200"
      : tone === "violet"
        ? "text-violet-200"
        : tone === "amber"
          ? "text-amber-200"
          : "text-cyan-200";
  return (
    <div className="rounded-xl bg-black/35 px-3 py-2.5 ring-1 ring-white/[0.06]">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-[18px] font-semibold leading-none tabular-nums sm:text-[20px]",
          toneClass,
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 font-mono text-[10px] text-zinc-600">{hint}</p>
      ) : null}
    </div>
  );
}

function WalletBalanceHeroInner({
  totalUsd,
  collateralUsd,
  positionsUsd,
  nativeBalanceLabel,
  collateralSymbol,
  isConnected,
  faucetUrl,
  onRefresh,
  refreshing,
}: {
  totalUsd: number;
  collateralUsd: number;
  positionsUsd: number;
  nativeBalanceLabel?: string | null;
  collateralSymbol: string;
  isConnected: boolean;
  faucetUrl: string;
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#0a0a12]/92 p-4 sm:p-5"
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/12 ring-1 ring-cyan-400/22">
            <Wallet className="h-5 w-5 text-cyan-200" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              On-chain balance
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {fullUsd(totalUsd)}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Collateral + open positions · BSC testnet
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={faucetUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-bold ring-1 transition",
              "bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950 ring-cyan-300/30 hover:brightness-110",
            )}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Get test {collateralSymbol}
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
          <button
            type="button"
            onClick={onRefresh}
            disabled={!isConnected || refreshing}
            aria-label="Refresh balances"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cell
          label="Collateral"
          value={compactUsd(collateralUsd)}
          tone="emerald"
          hint={collateralSymbol}
        />
        <Cell
          label="Positions"
          value={compactUsd(positionsUsd)}
          tone="violet"
          hint="YES / NO shares"
        />
        <Cell
          label="Gas"
          value={nativeBalanceLabel ?? "—"}
          tone="cyan"
          hint="tBNB"
        />
        <Cell
          label="Total"
          value={compactUsd(totalUsd)}
          tone="amber"
          hint="Mark-to-market"
        />
      </div>
    </motion.section>
  );
}

export const WalletBalanceHero = memo(WalletBalanceHeroInner);
