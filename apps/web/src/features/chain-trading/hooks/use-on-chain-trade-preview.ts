"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useDebouncedValue } from "@/shared/api/hooks";
import type { EnrichedQuote } from "@/features/trading/lib/trade-math";
import { collateralDecimals } from "../lib/chain-contract-env";
import { enrichFromChainPreview } from "../lib/chain-preview-math";
import { fetchChainTradePreview } from "../lib/fetch-chain-trade-preview";

export type OnChainPreviewInput = {
  marketAddress: Address | null;
  outcome: "YES" | "NO";
  direction: "BUY" | "SELL";
  /** USD amount when buying; share count when selling. */
  amount: number;
  midYes: number;
  debounceMs?: number;
};

function provisionalQuote(input: {
  outcome: "YES" | "NO";
  direction: "BUY" | "SELL";
  amount: number;
  midYes: number;
}): EnrichedQuote {
  const decimals = collateralDecimals();
  if (input.direction === "BUY") {
    return enrichFromChainPreview({
      direction: "BUY",
      outcome: input.outcome,
      collateralDecimals: decimals,
      feeBps: 0,
      collateralInUsd: input.amount,
      shares: input.amount,
      midYes: input.midYes,
    });
  }
  return enrichFromChainPreview({
    direction: "SELL",
    outcome: input.outcome,
    collateralDecimals: decimals,
    feeBps: 0,
    collateralInUsd: 0,
    shares: input.amount,
    midYes: input.midYes,
  });
}

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
  /** True once fee + preview reads have settled (success or error). */
  isReady: boolean;
} {
  const debouncedAmount = useDebouncedValue(String(amount), debounceMs);
  const amountNum = Number.parseFloat(debouncedAmount) || 0;
  const enabled = Boolean(marketAddress) && amountNum > 0;

  const query = useQuery({
    queryKey: [
      "chain",
      "trade-preview",
      marketAddress,
      outcome,
      direction,
      amountNum,
    ],
    enabled,
    staleTime: 4_000,
    gcTime: 60_000,
    retry: 1,
    queryFn: () =>
      fetchChainTradePreview({
        marketAddress: marketAddress!,
        outcome,
        direction,
        amount: amountNum,
        midYes,
      }),
  });

  const fallback = useMemo(
    () =>
      provisionalQuote({
        outcome,
        direction,
        amount: amountNum,
        midYes,
      }),
    [amountNum, direction, midYes, outcome],
  );

  const quote = query.data ?? fallback;
  const isFetching = enabled && query.isFetching;
  const isReady = !enabled || (query.isFetched && !query.isFetching);

  return {
    quote,
    isFetching,
    isError: query.isError,
    isReady,
  };
}
