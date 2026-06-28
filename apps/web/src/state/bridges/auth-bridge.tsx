"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAccount, useAccountEffect } from "wagmi";
import type { Address } from "viem";
import {
  AdminApiError,
  adminMeQueryKey,
  fetchAdminMe,
  hasAdminSessionCookie,
} from "@/widgets/admin-dashboard/lib/admin-api";
import {
  useWalletSessionQuery,
  walletSessionQueryKey,
} from "@/features/wallet/hooks/use-wallet-session-query";
import { tradingActorId } from "@/shared/api/fetchers/trading-headers";
import { useAuthStore, type UserRole } from "../stores/auth.store";

function normalizeRole(role: string | null | undefined): UserRole {
  if (role === "ADMIN" || role === "MODERATOR") return role;
  if (role === "USER") return "USER";
  return "GUEST";
}

/**
 * Keeps wagmi + SIWE session + operator role in sync for the whole app.
 */
export function AuthBridge() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const adminSurface = pathname.startsWith("/admin");

  const { address, chainId, isConnected } = useAccount();
  const { data: session, isFetched: sessionFetched } = useWalletSessionQuery();

  useAccountEffect({
    onConnect() {
      void queryClient.invalidateQueries({ queryKey: walletSessionQueryKey });
      void queryClient.invalidateQueries({ queryKey: adminMeQueryKey });
    },
    onDisconnect() {
      useAuthStore.getState().reset();
      queryClient.removeQueries({ queryKey: walletSessionQueryKey });
      queryClient.removeQueries({ queryKey: adminMeQueryKey });
    },
  });

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
    enabled: hasAdminSessionCookie(),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Operator JWT (/api/v1/admin/me) — preferred when cookie exists.
  useEffect(() => {
    if (!operatorMe.isFetched) return;
    if (operatorMe.isError) return;
    if (operatorMe.data) {
      useAuthStore.getState().setRole(operatorMe.data.role as UserRole);
    }
  }, [operatorMe.isFetched, operatorMe.isError, operatorMe.data]);

  // Wallet (wagmi) → store
  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }
    useAuthStore.getState().setWallet({
      address: address.toLowerCase() as Address,
      chainId: chainId ?? null,
    });
  }, [address, chainId, isConnected]);

  // SIWE session → store (global trading actor)
  useEffect(() => {
    if (!isConnected) return;

    const matches =
      session && address
        ? session.address.toLowerCase() === address.toLowerCase()
        : false;

    useAuthStore.getState().setSession({
      address: matches && session?.address
        ? (session.address.toLowerCase() as Address)
        : address
          ? (address.toLowerCase() as Address)
          : null,
      chainId: session?.chainId ?? chainId ?? null,
      isAuthenticated: !!matches,
    });

    if (matches && session?.role && !operatorMe.data) {
      const nextRole = normalizeRole(session.role);
      if (nextRole !== "GUEST") {
        useAuthStore.getState().setRole(nextRole);
      } else if (session.role === "USER") {
        useAuthStore.getState().setRole("USER");
      }
    }

    if (sessionFetched && !session) {
      useAuthStore.getState().setTradingUserId(tradingActorId() ?? null);
      return;
    }

    const envId = tradingActorId();
    const walletActor =
      matches && session?.userId && typeof session.userId === "string"
        ? session.userId
        : null;
    useAuthStore.getState().setTradingUserId(envId ?? walletActor ?? null);
  }, [
    session,
    sessionFetched,
    address,
    chainId,
    isConnected,
    operatorMe.data,
  ]);

  // Legacy admin layout pages still probe /admin/me when on that surface.
  useEffect(() => {
    if (!adminSurface) return;
    if (!hasAdminSessionCookie()) return;
    void queryClient.invalidateQueries({ queryKey: adminMeQueryKey });
  }, [adminSurface, queryClient]);

  return null;
}
