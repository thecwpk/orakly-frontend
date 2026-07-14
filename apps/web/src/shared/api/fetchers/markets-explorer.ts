import { apiClient } from "@/api/client/http-client";
import type {
  MarketsExplorerParams,
  MarketsExplorerResult,
} from "@/shared/contracts/markets-explorer";
import { unwrapApiResult } from "../unwrap";

function buildExplorerUrl(params: MarketsExplorerParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("limit", String(params.limit ?? 20));
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  if (params.status) sp.set("status", params.status);
  if (params.narrative) sp.set("narrative", params.narrative);
  if (params.creator) sp.set("creator", params.creator);
  if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params.dateTo) sp.set("dateTo", params.dateTo);
  if (params.minVolume != null) sp.set("minVolume", String(params.minVolume));
  if (params.maxVolume != null) sp.set("maxVolume", String(params.maxVolume));
  if (params.minProbability != null) {
    sp.set("minProbability", String(params.minProbability));
  }
  if (params.maxProbability != null) {
    sp.set("maxProbability", String(params.maxProbability));
  }
  if (params.sort) sp.set("sort", params.sort);
  if (params.communityOnly) sp.set("community", "1");
  return `/api/v1/markets?${sp.toString()}`;
}

export async function fetchMarketsExplorer(
  params: MarketsExplorerParams,
): Promise<MarketsExplorerResult> {
  const res = await apiClient.request<MarketsExplorerResult>(buildExplorerUrl(params));
  return unwrapApiResult(res);
}
