import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";

export type DiscoveryNewsArticle = {
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
};

export type DiscoveryNewsPayload = {
  provider: "google-news-rss" | "newsapi" | "newsapi+rss";
  query: string;
  articles: DiscoveryNewsArticle[];
  fetchedAt: string;
};

export async function fetchDiscoveryNews(q: string): Promise<DiscoveryNewsPayload> {
  const qs = new URLSearchParams({ q });
  const res = await apiClient.request<DiscoveryNewsPayload>(`/api/v1/news?${qs.toString()}`);
  return unwrapApiResult(res);
}
