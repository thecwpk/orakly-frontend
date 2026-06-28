"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminApiError, fetchAdminMe, hasAdminSessionCookie } from "../lib/admin-api";
import { useWalletSessionQuery } from "@/features/wallet/hooks/use-wallet-session-query";
import { useIsOperator } from "@/state/selectors/auth.selectors";

const ADMIN_NAV_SESSION_KEY = ["admin", "navSession"] as const;

/**
 * Lightweight probe: valid operator session cookie and/or wallet ADMIN role.
 */
export function useAdminNavSession() {
  const isOperator = useIsOperator();
  const { data: walletSession } = useWalletSessionQuery();
  const walletOperator =
    walletSession?.role === "ADMIN" || walletSession?.role === "MODERATOR";

  return useQuery({
    queryKey: ADMIN_NAV_SESSION_KEY,
    enabled: hasAdminSessionCookie() || isOperator || walletOperator,
    queryFn: async () => {
      try {
        return await fetchAdminMe();
      } catch (e) {
        if (e instanceof AdminApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useShowAdminNavLink(): boolean {
  const isOperator = useIsOperator();
  const { data: walletSession } = useWalletSessionQuery();
  const walletOperator =
    walletSession?.role === "ADMIN" || walletSession?.role === "MODERATOR";
  const { data, isSuccess } = useAdminNavSession();

  return isOperator || walletOperator || (isSuccess && data != null);
}
