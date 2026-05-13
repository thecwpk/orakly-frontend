"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import {
  AdminApiError,
  adminMeQueryKey,
  fetchAdminMe,
} from "@/widgets/admin-dashboard/lib/admin-api";
import { useWalletSessionQuery } from "@/features/wallet/hooks/use-wallet-session-query";
import { tradingActorId } from "@/shared/api/fetchers/trading-headers";
import { useAuthStore, type UserRole } from "../stores/auth.store";

/**
 * Listens to wagmi + the SIWE session query and writes the canonical actor
 * snapshot into `useAuthStore`. Exists so that:
 *
 *   1. Non-component code (fetchers, store subscribers) can read the actor
 *      via `useAuthStore.getState()` without round-tripping through React.
 *   2. Components that don't want to mount wagmi/react-query subscriptions
 *      (e.g. deeply embedded UI fragments) can still read auth state.
 *
 * Mount once near the top of the tree, *inside* `Web3AppProvider` so wagmi
 * hooks resolve.
 */
export function AuthBridge() {
  const pathname = usePathname();
  /** Operator session only matters inside `/admin/*` — avoid hitting `/admin/me` on every page. */
  const adminSurface = pathname.startsWith("/admin");

  const { address, chainId, isConnected } = useAccount();
  const { data: session } = useWalletSessionQuery();

  useEffect(() => {
    if (adminSurface) return;
    useAuthStore.getState().clearOperatorRole();
  }, [adminSurface]);

  const operatorMe = useQuery({
    queryKey: adminMeQueryKey,
    queryFn: async () => {
      try {
        return await fetchAdminMe();
      } catch (e) {
        if (e instanceof AdminApiError && e.status === 401) return null;
        throw e;
      }
    },
    enabled: adminSurface,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: adminSurface,
  });

  // Operator JWT (/api/v1/admin/me) → store role (ADMIN / MODERATOR)
  useEffect(() => {
    if (!adminSurface) return;
    if (!operatorMe.isFetched) return;
    if (operatorMe.isError) return;
    if (operatorMe.data) {
      useAuthStore.getState().setRole(operatorMe.data.role as UserRole);
    } else {
      useAuthStore.getState().clearOperatorRole();
    }
  }, [
    adminSurface,
    operatorMe.isFetched,
    operatorMe.isError,
    operatorMe.data,
  ]);

  // Wallet (wagmi) → store
  useEffect(() => {
    useAuthStore.getState().setWallet({
      address: isConnected && address ? (address.toLowerCase() as Address) : null,
      chainId: chainId ?? null,
    });
  }, [address, chainId, isConnected]);

  // SIWE session → store
  useEffect(() => {
    const matches =
      session && address
        ? session.address.toLowerCase() === address.toLowerCase()
        : false;
    useAuthStore.getState().setSession({
      address: session?.address ? (session.address.toLowerCase() as Address) : null,
      chainId: session?.chainId ?? null,
      isAuthenticated: !!matches,
    });
  }, [session, address]);

  // Trading actor: explicit env demo id wins; otherwise wallet session user id.
  useEffect(() => {
    const envId = tradingActorId();
    const walletActor =
      session?.userId && typeof session.userId === "string" ?
        session.userId
      : null;
    useAuthStore.getState().setTradingUserId(envId ?? walletActor ?? null);
  }, [session]);

  return null;
}
