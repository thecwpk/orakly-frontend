"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { isChainTradingConfigured } from "../config/contracts";
import {
  useOptimisticChainTradeMutation,
  type OptimisticChainTradeBody,
} from "../hooks/use-optimistic-chain-trade";

export type ChainTradeOutcomeButtonsProps = {
  userId: string;
  /** App / API market UUID for cache + optimistic rows */
  appMarketId: string;
  /** Market clone contract address */
  marketAddress?: `0x${string}`;
  /** Default collateral in wei (6 decimals) */
  defaultCollateralWei: bigint;
  tradesScope?: string;
  className?: string;
};

/**
 * Production UX shell: explicit **YES** / **NO** buys with pending states + optimistic list injection.
 * Requires wallet connected on TBNB + `NEXT_PUBLIC_CHAIN_MARKET_TRADE_ADDRESS`.
 */
export function ChainTradeOutcomeButtons({
  userId,
  appMarketId,
  marketAddress,
  defaultCollateralWei,
  tradesScope,
  className,
}: ChainTradeOutcomeButtonsProps) {
  const [qty, setQty] = useState(defaultCollateralWei.toString());
  const exec = useOptimisticChainTradeMutation({ userId, tradesScope });

  const collateralWei = useMemo(() => {
    try {
      return BigInt(qty.trim() || "0");
    } catch {
      return 0n;
    }
  }, [qty]);

  const disabled =
    (!isChainTradingConfigured() && !marketAddress) || collateralWei <= 0n;

  const submit = useCallback(
    (outcome: OptimisticChainTradeBody["outcome"]) => {
      if (disabled) return;
      exec.mutate({
        appMarketId,
        marketAddress,
        outcome,
        collateralWei,
      });
    },
    [appMarketId, disabled, exec, marketAddress, collateralWei],
  );

  if (!isChainTradingConfigured() && !marketAddress) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500",
          className,
        )}
      >
        On-chain desk inactive — set{" "}
        <span className="font-mono text-zinc-400">NEXT_PUBLIC_CHAIN_MARKET_TRADE_ADDRESS</span>.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        Collateral (wei)
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white outline-none ring-cyan-400/30 focus:ring-2"
          inputMode="numeric"
        />
      </label>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          disabled={disabled || exec.isPending}
          onClick={() => submit("YES")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 px-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {exec.isPending ?
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          : null}
          Buy YES
        </button>
        <button
          type="button"
          disabled={disabled || exec.isPending}
          onClick={() => submit("NO")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-rose-500/90 px-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/15 transition hover:bg-rose-400 disabled:opacity-50"
        >
          {exec.isPending ?
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          : null}
          Buy NO
        </button>
      </div>
    </div>
  );
}
