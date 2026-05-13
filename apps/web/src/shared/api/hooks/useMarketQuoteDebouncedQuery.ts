"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketQuote } from "../fetchers/markets-live";
import { queryKeys } from "../query-keys";
import { useDebouncedValue } from "./useDebouncedValue";

export function useMarketQuoteDebouncedQuery(
  marketId: string | undefined,
  params: {
    outcome: "YES" | "NO";
    direction: "BUY" | "SELL";
    quantity: string;
  },
  debounceMs = 350,
) {
  const quantityDebounced = useDebouncedValue(params.quantity, debounceMs);

  const quoteKey =
    marketId ?
      queryKeys.markets.quote(marketId, {
        outcome: params.outcome,
        direction: params.direction,
        quantity: quantityDebounced.trim(),
      })
    : null;

  const enabled =
    !!marketId &&
    quantityDebounced.trim().length > 0 &&
    !Number.isNaN(Number.parseFloat(quantityDebounced));

  return useQuery({
    queryKey: quoteKey ?? ["orakly", "markets", "quote", "disabled"],
    queryFn: () =>
      fetchMarketQuote(marketId!, {
        outcome: params.outcome,
        direction: params.direction,
        quantity: quantityDebounced.trim(),
      }),
    enabled: !!quoteKey && enabled,
    ...CACHE_POLICY.marketQuote,
    placeholderData: keepPreviousData,
  });
}
