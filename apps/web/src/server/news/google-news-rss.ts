/** Live headlines via Google News RSS — no API key; results change as publishers update. */

export type GoogleNewsArticle = {
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
};

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\u0022")
    .replace(/&apos;/g, "\u0027")
    .replace(/&#39;/g, "\u0027")
    .replace(/&#(\d+);/g, (full, n: string) => {
      const code = Number.parseInt(n, 10);
      if (!Number.isFinite(code) || code < 1 || code > 0x10ffff) return full;
      try {
        return String.fromCodePoint(code);
      } catch {
        return full;
      }
    });
}

function stripCdata(s: string): string {
  const m = s.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return (m ? m[1]! : s).trim();
}

function extractInner(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m?.[1]) return null;
  let inner = stripCdata(m[1].trim());
  inner = inner.replace(/<[^>]+>/g, "");
  inner = decodeXmlEntities(inner).trim();
  return inner || null;
}

/** Pull `<item>...</item>` blocks without a full XML parser (RSS is regular enough). */
export function parseGoogleNewsRssItems(xml: string, limit: number): GoogleNewsArticle[] {
  const items: GoogleNewsArticle[] = [];
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null && items.length < limit) {
    const block = m[1] ?? "";
    const title = extractInner(block, "title");
    const link = extractInner(block, "link");
    if (!title || !link) continue;
    const pub = extractInner(block, "pubDate");
    const sourceTag = extractInner(block, "source");
    const source =
      sourceTag ??
      (() => {
        const dash = title.lastIndexOf(" - ");
        if (dash > 0 && dash < title.length - 3) return title.slice(dash + 3).trim();
        return null;
      })();
    items.push({
      title,
      url: link,
      source,
      publishedAt: pub,
    });
  }
  return items;
}

export async function fetchGoogleNewsRss(
  query: string,
  limit: number,
): Promise<GoogleNewsArticle[]> {
  const q = query.trim().slice(0, 220);
  if (!q) return [];
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      "User-Agent": "OraklyMarketDiscovery/1.0",
    },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const xml = await res.text();
  return parseGoogleNewsRssItems(xml, limit);
}
