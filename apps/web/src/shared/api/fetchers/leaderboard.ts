import { apiClient } from "@/api/client/http-client";
import { backendRequest } from "../backend-client";
import { unwrapApiResult } from "../unwrap";
import type { LeaderboardWindow } from "@/features/leaderboard/lib/types";

export type LeaderboardPeriod = "all" | "month" | "week";

export type TraderLeaderboardSort =
  | "volume"
  | "accuracy"
  | "profit"
  | "winRate"
  | "pnl";

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
  avgTradeSizeUsd?: number;
  activeSince?: string | null;
  creatorScore?: number | null;
};

export type TraderLeaderboardViewerDto = {
  rank: number | null;
  qualifies: boolean;
  tradeCount: number;
  row: TraderLeaderboardRowDto | null;
};

export type TraderLeaderboardPageDto = {
  rows: TraderLeaderboardRowDto[];
  total: number;
  viewer: TraderLeaderboardViewerDto | null;
};

export type CreatorLeaderboardRowDto = {
  creatorAddress: string;
  marketCount: number;
  totalVolumeUsd: number;
  feesEarned: number;
  creatorScore: number;
};

export type CreatorLeaderboardPageDto = {
  rows: CreatorLeaderboardRowDto[];
  total: number;
  viewer: {
    rank: number | null;
    row: CreatorLeaderboardRowDto | null;
  } | null;
};

function normalizeTraderPage(raw: unknown): TraderLeaderboardPageDto {
  if (Array.isArray(raw)) {
    return { rows: raw as TraderLeaderboardRowDto[], total: raw.length, viewer: null };
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as TraderLeaderboardPageDto).rows)) {
    const page = raw as TraderLeaderboardPageDto;
    return {
      rows: page.rows,
      total: typeof page.total === "number" ? page.total : page.rows.length,
      viewer: page.viewer ?? null,
    };
  }
  return { rows: [], total: 0, viewer: null };
}

function normalizeCreatorPage(raw: unknown): CreatorLeaderboardPageDto {
  if (Array.isArray(raw)) {
    return {
      rows: raw as CreatorLeaderboardRowDto[],
      total: raw.length,
      viewer: null,
    };
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as CreatorLeaderboardPageDto).rows)) {
    const page = raw as CreatorLeaderboardPageDto;
    return {
      rows: page.rows,
      total: typeof page.total === "number" ? page.total : page.rows.length,
      viewer: page.viewer ?? null,
    };
  }
  return { rows: [], total: 0, viewer: null };
}

export async function fetchTraderLeaderboardPage(input?: {
  window?: LeaderboardWindow;
  period?: LeaderboardPeriod;
  take?: number;
  sort?: TraderLeaderboardSort;
  minTrades?: number;
  narrative?: string;
  limit?: number;
  address?: string;
}): Promise<TraderLeaderboardPageDto> {
  const sp = new URLSearchParams();
  if (input?.window) sp.set("window", input.window);
  if (input?.period) sp.set("period", input.period);
  if (input?.take) sp.set("take", String(input.take));
  if (input?.limit) sp.set("limit", String(input.limit));
  if (input?.sort) sp.set("sort", input.sort);
  if (input?.minTrades) sp.set("minTrades", String(input.minTrades));
  if (input?.narrative) sp.set("narrative", input.narrative);
  if (input?.address) sp.set("address", input.address);
  const q = sp.toString();
  const path = `/api/v1/leaderboard/traders${q ? `?${q}` : ""}`;
  const local = await apiClient.request<unknown>(path);
  if (local.ok) return normalizeTraderPage(unwrapApiResult(local));

  const res = await backendRequest<unknown>(`/leaderboard/traders${q ? `?${q}` : ""}`);
  return normalizeTraderPage(unwrapApiResult(res));
}

/** Convenience — returns rows only (backward compatible). */
export async function fetchTraderLeaderboard(input?: {
  window?: LeaderboardWindow;
  period?: LeaderboardPeriod;
  take?: number;
  sort?: TraderLeaderboardSort;
  minTrades?: number;
  narrative?: string;
  limit?: number;
  address?: string;
}): Promise<TraderLeaderboardRowDto[]> {
  const page = await fetchTraderLeaderboardPage(input);
  return page.rows;
}

export async function fetchCreatorLeaderboardPage(input?: {
  limit?: number;
  narrative?: string;
  period?: LeaderboardPeriod;
  sort?: "fees" | "score" | "volume";
  address?: string;
}): Promise<CreatorLeaderboardPageDto> {
  const sp = new URLSearchParams({ limit: String(input?.limit ?? 100) });
  if (input?.narrative) sp.set("narrative", input.narrative);
  if (input?.period) sp.set("period", input.period);
  if (input?.sort) sp.set("sort", input.sort);
  if (input?.address) sp.set("address", input.address);
  const res = await apiClient.request<unknown>(
    `/api/v1/leaderboard/creators?${sp.toString()}`,
  );
  return normalizeCreatorPage(unwrapApiResult(res));
}

export async function fetchCreatorLeaderboard(
  limit = 100,
  narrative?: string,
): Promise<CreatorLeaderboardRowDto[]> {
  const page = await fetchCreatorLeaderboardPage({ limit, narrative });
  return page.rows;
}
