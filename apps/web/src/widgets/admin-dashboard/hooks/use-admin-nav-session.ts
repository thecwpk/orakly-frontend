"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminApiError, fetchAdminMe } from "../lib/admin-api";

const ADMIN_NAV_SESSION_KEY = ["admin", "navSession"] as const;

/**
 * Lightweight probe: does the browser hold a valid operator session cookie?
 * Used for nav visibility only — does not replace `/admin/*` AuthBridge role sync.
 */
export function useAdminNavSession() {
  return useQuery({
    queryKey: ADMIN_NAV_SESSION_KEY,
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
  const { data, isSuccess } = useAdminNavSession();
  return isSuccess && data != null;
}
