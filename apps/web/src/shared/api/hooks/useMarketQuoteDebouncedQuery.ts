"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { UiTradeDirection, UiTradeOutcome } from "@/shared/trading/narrative-trade-side";
import { toTradeApiSide } from "@/shared/trading/narrative-trade-side";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketQuote } from "../fetchers/markets-live";
import { queryKeys } from "../query-keys";
import { useDebouncedValue } from "./useDebouncedValue";

export function useMarketQuoteDebouncedQuery(
  marketId: string | undefined,
  params: {
    /** UI label — converted to FOR|AGAINST before API call. */
    outcome: UiTradeOutcome;
    direction: UiTradeDirection;
    quantity: string;
  },
  debounceMs = 350,
) {
  const quantityDebounced = useDebouncedValue(params.quantity, debounceMs);
  const side = toTradeApiSide(params.outcome, params.direction);

  const quoteKey =
    marketId ?
      queryKeys.markets.quote(marketId, {
        side,
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
        side,
        direction: params.direction,
        quantity: quantityDebounced.trim(),
      }),
    enabled: !!quoteKey && enabled,
    ...CACHE_POLICY.marketQuote,
    placeholderData: keepPreviousData,
  });
}
