import { backendRequest } from "../backend-client";
import { unwrapApiResult } from "../unwrap";
import type { LeaderboardWindow } from "@/features/leaderboard/lib/types";

export type TraderLeaderboardRowDto = {
  userId: string;
  displayName: string | null;
  walletAddress: string | null;
  totalVolumeUsd: string;
  winRatePct: number;
  pnlUsd: string;
  resolvedMarkets: number;
};

export async function fetchTraderLeaderboard(input?: {
  window?: LeaderboardWindow;
  take?: number;
}): Promise<TraderLeaderboardRowDto[]> {
  const sp = new URLSearchParams();
  if (input?.window) sp.set("window", input.window);
  if (input?.take) sp.set("take", String(input.take));
  const q = sp.toString();
  const res = await backendRequest<TraderLeaderboardRowDto[]>(
    `/leaderboard/traders${q ? `?${q}` : ""}`,
  );
  return unwrapApiResult(res);
}
