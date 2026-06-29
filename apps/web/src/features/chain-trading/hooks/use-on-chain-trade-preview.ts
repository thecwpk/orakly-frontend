"use client";

import { useMemo } from "react";
import { parseUnits, type Address } from "viem";
import { useReadContract } from "wagmi";
import { useDebouncedValue } from "@/shared/api/hooks";
import { collateralDecimals } from "../lib/chain-contract-env";
import { enrichFromChainPreview } from "../lib/chain-preview-math";
import { marketAbi } from "../abis/market";
import type { EnrichedQuote } from "@/features/trading/lib/trade-math";

const SHARE_DECIMALS = 18;

export type OnChainPreviewInput = {
  marketAddress: Address | null;
  outcome: "YES" | "NO";
  direction: "BUY" | "SELL";
  /** USD amount when buying; share count when selling. */
  amount: number;
  midYes: number;
  debounceMs?: number;
};

export function useOnChainTradePreview({
  marketAddress,
  outcome,
  direction,
  amount,
  midYes,
  debounceMs = 280,
}: OnChainPreviewInput): {
  quote: EnrichedQuote;
  isFetching: boolean;
  isError: boolean;
} {
  const debouncedAmount = useDebouncedValue(String(amount), debounceMs);
  const amountNum = Number.parseFloat(debouncedAmount) || 0;
  const decimals = collateralDecimals();
  const enabled = Boolean(marketAddress) && amountNum > 0;

  const { data: feeBps = 0, isFetching: feePending } = useReadContract({
    address: marketAddress ?? undefined,
    abi: marketAbi,
    functionName: "feeBps",
    query: { enabled: Boolean(marketAddress) },
  });

  const collateralWei = useMemo(() => {
    if (!enabled || direction !== "BUY") return 0n;
    try {
      return parseUnits(amountNum.toFixed(decimals), decimals);
    } catch {
      return 0n;
    }
  }, [amountNum, decimals, direction, enabled]);

  const sharesWei = useMemo(() => {
    if (!enabled || direction !== "SELL") return 0n;
    try {
      return parseUnits(amountNum.toFixed(6), SHARE_DECIMALS);
    } catch {
      return 0n;
    }
  }, [amountNum, direction, enabled]);

  const netCollateralWei = useMemo(() => {
    if (collateralWei <= 0n) return 0n;
    const bps = BigInt(Math.min(Number(feeBps) || 0, 200));
    return (collateralWei * (10_000n - bps)) / 10_000n;
  }, [collateralWei, feeBps]);

  const previewFn =
    direction === "BUY"
      ? outcome === "YES"
        ? "previewBuyYes"
        : "previewBuyNo"
      : outcome === "YES"
        ? "previewSellYesOut"
        : "previewSellNoOut";

  const previewArgs =
    direction === "BUY" ? ([netCollateralWei] as const) : ([sharesWei] as const);

  const { data: previewData, isFetching: previewPending, isError } = useReadContract({
    address: marketAddress ?? undefined,
    abi: marketAbi,
    functionName: previewFn,
    args: previewArgs,
    query: {
      enabled: enabled && (direction === "BUY" ? netCollateralWei > 0n : sharesWei > 0n),
    },
  });

  const quote = useMemo(() => {
    const bps = Number(feeBps) || 0;
    if (direction === "BUY") {
      return enrichFromChainPreview({
        direction,
        outcome,
        collateralDecimals: decimals,
        feeBps: bps,
        collateralInUsd: amountNum,
        shares: amountNum,
        previewSharesOutWei: previewData as bigint | undefined,
        midYes,
      });
    }
    return enrichFromChainPreview({
      direction,
      outcome,
      collateralDecimals: decimals,
      feeBps: bps,
      collateralInUsd: 0,
      shares: amountNum,
      previewSell: previewData as readonly [bigint, bigint] | undefined,
      midYes,
    });
  }, [amountNum, decimals, direction, feeBps, midYes, outcome, previewData]);

  return {
    quote,
    isFetching: feePending || previewPending,
    isError,
  };
}
