/**
 * Central TanStack Query keys — prevents typos and eases invalidation.
 * Feature hooks should import keys from here (not inline string arrays).
 */
export const queryKeys = {
  markets: {
    featured: ["markets", "featured"] as const,
    detail: (slug: string) => ["markets", "detail", slug] as const,
  },
  portfolio: {
    summary: ["portfolio", "summary"] as const,
  },
  activity: {
    feed: (cursor?: string) => ["activity", "feed", cursor ?? "head"] as const,
  },
} as const;
