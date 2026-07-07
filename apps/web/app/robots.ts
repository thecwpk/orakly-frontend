import type { MetadataRoute } from "next";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://orakly-frontend-web.vercel.app"
  ).replace(/\/$/, "");
}

/** Public crawl rules — allows search engines and AI review fetchers. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/internal/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
