"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { queryKeys } from "../query-keys";

export type SpotPricesDto = {
  btc: { usd: number | null; chg24hPct: number | null };
  eth: { usd: number | null; chg24hPct: number | null };
};

async function fetchSpotPrices(): Promise<SpotPricesDto> {
  const res = await fetch("/api/v1/spot-prices", { credentials: "same-origin" });
  if (!res.ok) {
    return {
      btc: { usd: null, chg24hPct: null },
      eth: { usd: null, chg24hPct: null },
    };
  }
  return res.json() as Promise<SpotPricesDto>;
}

export function useSpotPricesQuery() {
  return useQuery({
    queryKey: queryKeys.reference.spotPrices(),
    queryFn: fetchSpotPrices,
    ...CACHE_POLICY.marketsFeed,
    staleTime: 25_000,
    refetchInterval: 30_000,
  });
}
