"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchWalletBalance } from "../fetchers/wallet-balance";
import { queryKeys } from "../query-keys";

export function useWalletBalanceQuery(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.wallet.balance(userId) : [...queryKeys.wallet.root(), "balance", "__idle"],
    queryFn: () => fetchWalletBalance(userId),
    enabled: !!userId,
    ...CACHE_POLICY.portfolio,
  });
}
