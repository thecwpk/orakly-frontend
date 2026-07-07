import { cacheGet, cacheSet } from "../lib/cache.js";
import { NEWS_KEYWORD_MAP, type NarrativeKey } from "../lib/constants.js";
import { fetchJsonWithRetry } from "../lib/http-client.js";

const SOURCE = "cryptopanic";

export type CryptoPanicNarrativeRow = {
  narrative: string;
  mentionScore: number;
  sentimentScore: number;
};

type NewsItem = {
  id?: number | string;
  title?: string;
  url?: string;
  votes?: { positive?: number; negative?: number; important?: number };
  currencies?: Array<{ code?: string; title?: string }>;
};

type NewsResponse = {
  results?: NewsItem[];
};

const seenNewsIds = new Set<string>();

function matchNarratives(text: string): NarrativeKey[] {
  const hits = new Set<NarrativeKey>();
  for (const row of NEWS_KEYWORD_MAP) {
    if (row.pattern.test(text)) hits.add(row.narrative);
  }
  return [...hits];
}

function sentimentFromVotes(votes?: NewsItem["votes"]): number {
  const pos = votes?.positive ?? 0;
  const neg = votes?.negative ?? 0;
  const imp = votes?.important ?? 0;
  const total = pos + neg + imp;
  if (total <= 0) return 0;
  return Number((((pos + imp * 0.5) - neg) / total).toFixed(4));
}

export async function getNews(): Promise<CryptoPanicNarrativeRow[]> {
  return cacheGet<CryptoPanicNarrativeRow[]>("cryptopanic:news").then(async (hit) => {
    if (hit) return hit;

    const token = process.env.CRYPTOPANIC_API_TOKEN?.trim();
    const url = token
      ? `https://cryptopanic.com/api/v1/posts/?auth_token=${token}&public=true`
      : "https://cryptopanic.com/api/free/v1/posts/?public=true";

    const { data } = await fetchJsonWithRetry<NewsResponse>(url, SOURCE);

    const byNarrative = new Map<string, { mentions: number; sentiment: number }>();

    for (const item of data.results ?? []) {
      const dedupeKey = String(item.id ?? item.url ?? item.title ?? "");
      if (!dedupeKey || seenNewsIds.has(dedupeKey)) continue;
      seenNewsIds.add(dedupeKey);
      if (seenNewsIds.size > 5000) {
        const first = seenNewsIds.values().next().value as string;
        seenNewsIds.delete(first);
      }

      const currencyText = (item.currencies ?? [])
        .map((c) => `${c.code ?? ""} ${c.title ?? ""}`)
        .join(" ");
      const text = `${item.title ?? ""} ${currencyText}`;
      const narratives = matchNarratives(text);
      if (narratives.length === 0) continue;

      const sentiment = sentimentFromVotes(item.votes);
      for (const narrative of narratives) {
        const prev = byNarrative.get(narrative) ?? { mentions: 0, sentiment: 0 };
        byNarrative.set(narrative, {
          mentions: prev.mentions + 1,
          sentiment: prev.sentiment + sentiment,
        });
      }
    }

    const maxMentions = Math.max(...[...byNarrative.values()].map((v) => v.mentions), 1);

    const rows: CryptoPanicNarrativeRow[] = [...byNarrative.entries()].map(
      ([narrative, v]) => ({
        narrative,
        mentionScore: Number(((v.mentions / maxMentions) * 100).toFixed(4)),
        sentimentScore: Number(
          ((v.sentiment / Math.max(v.mentions, 1) + 1) * 50).toFixed(4),
        ),
      }),
    );

    await cacheSet("cryptopanic:news", rows);
    return rows;
  });
}
