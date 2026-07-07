import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/public-site-url";

/** Key public routes for search engines and AI reviewers. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicSiteUrl();
  const now = new Date();

  const paths = [
    "/",
    "/dapp",
    "/discover",
    "/markets",
    "/activity",
    "/analytics",
    "/narrative-wars",
    "/leaderboard",
    "/attention",
    "/portfolio",
    "/wallet",
    "/sign-in",
  ];

  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/dapp" ? "daily" : "weekly",
    priority: path === "/dapp" ? 1 : 0.7,
  }));
}
