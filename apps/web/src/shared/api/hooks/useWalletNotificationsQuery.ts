"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWalletNotifications } from "../fetchers/wallet-notifications";
import { queryKeys } from "../query-keys";

export function useWalletNotificationsQuery(
  walletAddress: string | undefined,
  options?: { pollMs?: number },
) {
  const pollMs = options?.pollMs ?? 30_000;
  const address = walletAddress?.trim().toLowerCase();

  return useQuery({
    queryKey: address
      ? queryKeys.activity.walletNotifications(address)
      : [...queryKeys.activity.root(), "wallet-notifications", "__idle"],
    queryFn: () =>
      fetchWalletNotifications({
        walletAddress: address!,
        limit: 20,
      }),
    enabled: Boolean(address),
    refetchInterval: address ? pollMs : false,
    staleTime: 10_000,
  });
}
