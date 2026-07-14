"use client";

import { useQuery } from "@tanstack/react-query";
import {
  adminApi,
  adminMeQueryKey,
  type AdminMe,
} from "../lib/admin-api";

export type OverviewDto = {
  usersTotal: number;
  marketsByStatus: Record<string, number>;
  trades24h: number;
  trades7d: number;
  platformFeesUsd: string;
  platformFeeEvents: number;
  volumeNotional7dUsd: string;
  moderationQueue: number;
};

export type RevenuePoint = { day: string; feesUsd: string };
export type RevenueDto = { from: string; to: string; series: RevenuePoint[] };

export type AdminMarketRow = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  status: string;
  takerFeeBps?: number;
  volumeTotalUsd?: string | number;
  closesAt: string;
  onChainAddress?: string | null;
  chainId?: number | null;
  narrative?: string | null;
  resolutionSource?: string | null;
  creatorRewardPercent?: number;
  generationMeta?: { adminCategory?: string; minimumBetBnb?: number } | null;
  category: { id: string; name: string; slug: string } | null;
};

export type AdminUserRow = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: string;
  isSuspended: boolean;
  wallet: { availableBalance: unknown; lockedBalance: unknown } | null;
};

export type AdminUserPage = {
  users: AdminUserRow[];
  nextCursor: string | null;
};

export type AdminCategoryRow = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  _count: { markets: number };
};

/* ---------------------------------------------------------------- */

export const adminMeKey = adminMeQueryKey;
export const adminOverviewKey = ["admin", "overview"] as const;
export const adminRevenueKey = (days: number) => ["admin", "revenue", days] as const;
export const adminMarketsKey = (status: string, take: number) =>
  ["admin", "markets", status, take] as const;
export const adminUsersKey = ["admin", "users"] as const;
export const adminCategoriesKey = ["admin", "categories"] as const;

/* ---------------------------------------------------------------- */

export function useAdminMeQuery(enabled = true) {
  return useQuery({
    queryKey: adminMeKey,
    queryFn: () => adminApi<AdminMe>("/me"),
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    enabled,
  });
}

export function useAdminOverviewQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminOverviewKey,
    queryFn: () => adminApi<OverviewDto>("/analytics/overview"),
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useAdminRevenueQuery(days: number, enabled: boolean) {
  return useQuery({
    queryKey: adminRevenueKey(days),
    queryFn: () => adminApi<RevenueDto>(`/analytics/revenue?days=${days}`),
    enabled,
    staleTime: 60_000,
  });
}

export function useAdminMarketsQuery(
  status: string,
  enabled: boolean,
  take = 120,
) {
  return useQuery({
    queryKey: adminMarketsKey(status, take),
    queryFn: () =>
      adminApi<AdminMarketRow[]>(
        `/markets?take=${take}&status=${encodeURIComponent(status)}`,
      ),
    enabled,
    staleTime: 10_000,
  });
}

export function useAdminUsersQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminUsersKey,
    queryFn: () => adminApi<AdminUserPage>("/users?take=60"),
    enabled,
    staleTime: 15_000,
  });
}

export function useAdminCategoriesQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminCategoriesKey,
    queryFn: () => adminApi<AdminCategoryRow[]>("/categories"),
    enabled,
    staleTime: 30_000,
  });
}
