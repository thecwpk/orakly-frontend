import { cacheGet, cacheSet } from "../lib/cache.js";
import { NEWS_KEYWORD_MAP, REDDIT_SUBREDDITS } from "../lib/constants.js";
import { fetchJsonWithRetry } from "../lib/http-client.js";

const SOURCE = "reddit";

export type RedditNarrativeRow = {
  narrative: string;
  engagementScore: number;
};

type RedditListing = {
  data?: {
    children?: Array<{
      data?: {
        id?: string;
        title?: string;
        selftext?: string;
        ups?: number;
        num_comments?: number;
      };
    }>;
  };
};

const seenPostIds = new Set<string>();

function engagement(upvotes: number, comments: number): number {
  return upvotes * Math.log(1 + Math.max(0, comments));
}

export async function getCryptoPosts(): Promise<RedditNarrativeRow[]> {
  const cached = await cacheGet<RedditNarrativeRow[]>("reddit:crypto");
  if (cached) return cached;

  const fetches = REDDIT_SUBREDDITS.map(async (sub) => {
    const url = `https://www.reddit.com/r/${sub}/hot.json?limit=50`;
    const { data } = await fetchJsonWithRetry<RedditListing>(url, SOURCE, {
      headers: { "User-Agent": "orakly-narratives/1.0" },
    });
    return data.data?.children ?? [];
  });

  const listings = await Promise.all(fetches);
  const byNarrative = new Map<string, number>();

  for (const children of listings) {
    for (const child of children) {
      const post = child.data;
      if (!post?.id || seenPostIds.has(post.id)) continue;
      seenPostIds.add(post.id);
      if (seenPostIds.size > 8000) {
        const first = seenPostIds.values().next().value as string;
        seenPostIds.delete(first);
      }

      const text = `${post.title ?? ""} ${post.selftext ?? ""}`;
      const score = engagement(post.ups ?? 0, post.num_comments ?? 0);

      for (const row of NEWS_KEYWORD_MAP) {
        if (row.pattern.test(text)) {
          byNarrative.set(
            row.narrative,
            (byNarrative.get(row.narrative) ?? 0) + score,
          );
        }
      }
    }
  }

  const max = Math.max(...[...byNarrative.values()], 1);
  const rows: RedditNarrativeRow[] = [...byNarrative.entries()].map(
    ([narrative, raw]) => ({
      narrative,
      engagementScore: Number(((raw / max) * 100).toFixed(4)),
    }),
  );

  await cacheSet("reddit:crypto", rows);
  return rows;
}
