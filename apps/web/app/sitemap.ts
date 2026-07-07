import type { MetadataRoute } from "next";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://orakly-frontend-web.vercel.app"
  ).replace(/\/$/, "");
}

/** Key public routes for search engines and AI reviewers. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
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
