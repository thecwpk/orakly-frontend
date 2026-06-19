import { apiClient } from "@/api/client/http-client";
import type {
  AttentionNarrativeRow,
  CategoryOverviewRow,
  HomeStatsPayload,
  HubMarketEnriched,
  MarketSuggestionRow,
  NarrativeWarCard,
} from "@/shared/contracts/hub-home";
import { unwrapApiResult } from "../unwrap";

export async function fetchAttentionDashboard(): Promise<AttentionNarrativeRow[]> {
  const res = await apiClient.request<AttentionNarrativeRow[]>("/api/v1/dashboard/attention");
  return unwrapApiResult(res);
}

export async function fetchHomeStats(): Promise<HomeStatsPayload> {
  const res = await apiClient.request<HomeStatsPayload>("/api/v1/home/stats");
  return unwrapApiResult(res);
}

export async function fetchNarrativeWars(): Promise<NarrativeWarCard[]> {
  const res = await apiClient.request<NarrativeWarCard[]>("/api/v1/narrative-wars");
  return unwrapApiResult(res);
}

export async function fetchConvictionMarkets(take = 6): Promise<HubMarketEnriched[]> {
  const res = await apiClient.request<HubMarketEnriched[]>(
    `/api/v1/markets/conviction?take=${take}`,
  );
  return unwrapApiResult(res);
}

export async function fetchHubTrendingMarkets(
  take = 20,
  cat?: string | null,
): Promise<HubMarketEnriched[]> {
  const qs = new URLSearchParams({ take: String(take) });
  if (cat && cat !== "all") qs.set("cat", cat);
  const res = await apiClient.request<HubMarketEnriched[]>(
    `/api/v1/markets/trending-hub?${qs.toString()}`,
  );
  return unwrapApiResult(res);
}

export async function fetchCategoriesOverview(): Promise<CategoryOverviewRow[]> {
  const res = await apiClient.request<CategoryOverviewRow[]>("/api/v1/categories/overview");
  return unwrapApiResult(res);
}

export async function fetchMarketSuggestions(take = 5): Promise<MarketSuggestionRow[]> {
  const res = await apiClient.request<MarketSuggestionRow[]>(
    `/api/v1/markets/suggestions?take=${take}`,
  );
  return unwrapApiResult(res);
}
