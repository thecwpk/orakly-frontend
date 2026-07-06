import { apiClient } from "@/api/client/http-client";
import { backendRequest } from "../backend-client";
import { unwrapApiResult } from "../unwrap";
import type { LeaderboardWindow } from "@/features/leaderboard/lib/types";

export type TraderLeaderboardSort = "volume" | "winRate" | "pnl";

export type TraderLeaderboardRowDto = {
  userId: string;
  displayName: string | null;
  walletAddress: string | null;
  totalVolumeUsd: string;
  winRatePct: number;
  pnlUsd: string;
  resolvedMarkets: number;
  tradeCount: number;
  bestTradeUsd: number;
  marketsTraded: number;
};

export type CreatorLeaderboardRowDto = {
  creatorAddress: string;
  marketCount: number;
  totalVolumeUsd: number;
  feesEarned: number;
};

export async function fetchTraderLeaderboard(input?: {
  window?: LeaderboardWindow;
  take?: number;
  sort?: TraderLeaderboardSort;
  minTrades?: number;
}): Promise<TraderLeaderboardRowDto[]> {
  const sp = new URLSearchParams();
  if (input?.window) sp.set("window", input.window);
  if (input?.take) sp.set("take", String(input.take));
  if (input?.sort) sp.set("sort", input.sort);
  if (input?.minTrades) sp.set("minTrades", String(input.minTrades));
  const q = sp.toString();
  const path = `/api/v1/leaderboard/traders${q ? `?${q}` : ""}`;
  const local = await apiClient.request<TraderLeaderboardRowDto[]>(path);
  if (local.ok) return unwrapApiResult(local);

  const res = await backendRequest<TraderLeaderboardRowDto[]>(
    `/leaderboard/traders${q ? `?${q}` : ""}`,
  );
  return unwrapApiResult(res);
}

export async function fetchCreatorLeaderboard(
  limit = 100,
): Promise<CreatorLeaderboardRowDto[]> {
  const res = await apiClient.request<CreatorLeaderboardRowDto[]>(
    `/api/v1/leaderboard/creators?limit=${limit}`,
  );
  return unwrapApiResult(res);
}
