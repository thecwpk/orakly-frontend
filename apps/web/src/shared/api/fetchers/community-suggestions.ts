import { apiClient } from "@/api/client/http-client";
import type {
  CommunitySuggestion,
  CommunitySuggestionSort,
  CreateCommunitySuggestionInput,
  VoteCommunitySuggestionResult,
} from "@/shared/contracts/community-suggestion";
import { unwrapApiResult } from "../unwrap";

export type FetchCommunitySuggestionsParams = {
  status?: string;
  sort?: CommunitySuggestionSort;
  address?: string;
  limit?: number;
};

function buildSuggestionsUrl(params: FetchCommunitySuggestionsParams): string {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.sort) sp.set("sort", params.sort);
  if (params.address) sp.set("address", params.address);
  if (params.limit != null) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return `/api/v1/suggestions${qs ? `?${qs}` : ""}`;
}

export async function fetchCommunitySuggestions(
  params: FetchCommunitySuggestionsParams,
): Promise<CommunitySuggestion[]> {
  const res = await apiClient.request<CommunitySuggestion[]>(buildSuggestionsUrl(params));
  return unwrapApiResult(res);
}

export async function voteCommunitySuggestion(
  suggestionId: string,
): Promise<VoteCommunitySuggestionResult> {
  const res = await apiClient.request<VoteCommunitySuggestionResult>(
    `/api/v1/suggestions/${suggestionId}/vote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );
  return unwrapApiResult(res);
}

export async function createCommunitySuggestion(
  input: CreateCommunitySuggestionInput,
): Promise<CommunitySuggestion> {
  const res = await apiClient.request<CommunitySuggestion>("/api/v1/suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return unwrapApiResult(res);
}
