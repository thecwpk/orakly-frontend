import type { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { ok, err } from "../_lib/response";
import { type GoogleNewsArticle, fetchGoogleNewsRss } from "@/server/news/google-news-rss";

export const dynamic = "force-dynamic";

type NewsArticleOut = GoogleNewsArticle;

function dedupeByUrl(items: NewsArticleOut[]): NewsArticleOut[] {
  const seen = new Set<string>();
  const out: NewsArticleOut[] = [];
  for (const it of items) {
    const k = it.url.split("?")[0] ?? it.url;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

async function fetchNewsApiEverything(q: string, take: number): Promise<NewsArticleOut[]> {
  const key = process.env.NEWSAPI_KEY ?? process.env.NEWSAPI_ORG_KEY;
  if (!key) return [];
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", q);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(Math.min(20, take)));
  url.searchParams.set("apiKey", key);

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    articles?: {
      title?: string;
      url?: string;
      source?: { name?: string };
      publishedAt?: string;
    }[];
  };
  return (json.articles ?? [])
    .filter((a): a is typeof a & { title: string; url: string } => Boolean(a.title && a.url))
    .map((a) => ({
      title: a.title!,
      url: a.url!,
      source: a.source?.name ?? null,
      publishedAt: a.publishedAt ?? null,
    }));
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q")?.trim();
  const q = raw && raw.length > 0 ? raw.slice(0, 280) : "cryptocurrency OR bitcoin OR prediction markets";

  const cached = unstable_cache(
    async () => {
      const [rss, api] = await Promise.all([
        fetchGoogleNewsRss(q, 28),
        fetchNewsApiEverything(q, 12),
      ]);
      const merged = dedupeByUrl([...api, ...rss]).slice(0, 28);
      const provider =
        api.length > 0 && rss.length > 0
          ? ("newsapi+rss" as const)
          : api.length > 0
            ? ("newsapi" as const)
            : ("google-news-rss" as const);
      return {
        provider,
        query: q,
        articles: merged,
        fetchedAt: new Date().toISOString(),
      };
    },
    ["public-discovery-news", q],
    { revalidate: 90, tags: ["discovery-news"] },
  );

  try {
    const data = await cached();
    return NextResponse.json(ok(data), {
      headers: {
        "Cache-Control": "public, s-maxage=90, stale-while-revalidate=240",
      },
    });
  } catch {
    return NextResponse.json(err("NEWS_FETCH_FAILED", "Could not load headlines right now."), {
      status: 502,
    });
  }
}
