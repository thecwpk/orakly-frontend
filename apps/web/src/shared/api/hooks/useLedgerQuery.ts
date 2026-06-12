"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchLedgerEntries } from "../fetchers/ledger";
import { queryKeys } from "../query-keys";

export function useLedgerQuery(userId: string | undefined) {
  return useQuery({
    queryKey: userId
      ? [...queryKeys.wallet.root(), userId, "ledger"] as const
      : [...queryKeys.wallet.root(), "ledger", "__idle"],
    queryFn: () => fetchLedgerEntries(userId, { limit: 80 }),
    enabled: !!userId,
    ...CACHE_POLICY.portfolio,
  });
}
