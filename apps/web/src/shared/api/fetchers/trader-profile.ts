import { apiClient } from "@/api/client/http-client";
import type {
  ProfileTradesPage,
  TraderProfilePayload,
} from "@/shared/contracts/trader-profile";
import { unwrapApiResult } from "../unwrap";

export async function fetchTraderProfile(
  address: string,
): Promise<TraderProfilePayload> {
  const res = await apiClient.request<TraderProfilePayload>(
    `/api/v1/profile/${encodeURIComponent(address)}`,
  );
  return unwrapApiResult(res);
}

export async function fetchTraderProfileTrades(
  address: string,
  params: { take?: number; cursor?: string | null } = {},
): Promise<ProfileTradesPage> {
  const sp = new URLSearchParams();
  if (params.take != null) sp.set("take", String(params.take));
  if (params.cursor) sp.set("cursor", params.cursor);
  const qs = sp.toString();
  const res = await apiClient.request<ProfileTradesPage>(
    `/api/v1/profile/${encodeURIComponent(address)}/trades${qs ? `?${qs}` : ""}`,
  );
  return unwrapApiResult(res);
}
