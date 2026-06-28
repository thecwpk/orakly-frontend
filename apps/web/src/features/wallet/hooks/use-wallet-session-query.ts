"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import type { UserRole } from "@/state/stores/auth.store";

export type WalletSessionPayload = {
  address: Address;
  chainId: number;
  /** Present after SIWE — custodial trading actor id. */
  userId?: string | null;
  /** Platform role — ADMIN wallets unlock operator nav + panel. */
  role?: UserRole | string | null;
};

async function fetchWalletSession(): Promise<WalletSessionPayload | null> {
  const res = await fetch("/api/v1/wallet/auth/session", {
    credentials: "include",
    cache: "no-store",
  });
  if (res.status === 401) return null;
  const body = (await res.json()) as {
    ok?: boolean;
    data?: WalletSessionPayload;
  };
  if (!body.ok || !body.data?.address) return null;
  return {
    address: body.data.address,
    chainId: body.data.chainId,
    userId: body.data.userId ?? null,
    role: body.data.role ?? "USER",
  };
}

export const walletSessionQueryKey = ["wallet-session"] as const;

export function useWalletSessionQuery() {
  const { isConnected } = useAccount();

  return useQuery({
    queryKey: walletSessionQueryKey,
    queryFn: fetchWalletSession,
    enabled: isConnected,
    staleTime: 15_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
