import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/public-site-url";

/** Public crawl rules — allows search engines and AI review fetchers. */
export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl();

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
