/** Deterministic “wire” lines for hub spotlight — UI-only context until a real news feed exists. */

export type SpotlightNewsLine = {
  source: string;
  headline: string;
  /** Synthetic recency for layout parity with PM until live feeds ship. */
  ago: string;
};

const SOURCES = [
  "Reuters",
  "BBC News",
  "The Wall Street Journal",
  "The Washington Post",
  "AP News",
] as const;

function hashU32(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickSource(seed: string, i: number): string {
  return SOURCES[hashU32(seed, i + 11) % SOURCES.length]!;
}

const AGO_POOL = ["4h ago", "9h ago", "1d ago", "2d ago", "3d ago"] as const;

function pickAgo(seed: string, i: number): string {
  return AGO_POOL[hashU32(seed, i + 99) % AGO_POOL.length]!;
}

/**
 * Three compact rows: ties wording to the question while rotating recognizable outlets.
 */
export function buildSpotlightNewsLines(marketTitle: string): SpotlightNewsLine[] {
  const title = marketTitle.trim();
  const core =
    title.length > 64 ? `${title.slice(0, 62).trim()}…` : title || "This outcome";

  const h0 = hashU32(title, 0);
  const h1 = hashU32(title, 1);

  return [
    {
      source: pickSource(title, 0),
      ago: pickAgo(title, 0),
      headline: `${core}: filings, speeches, and prints traders are watching.`,
    },
    {
      source: pickSource(title, 1),
      ago: pickAgo(title, 1),
      headline:
        h0 % 2 === 0
          ? "Forecasters revise scenarios as positioning shifts across venues."
          : "Flows across related markets reflect how venues mark baseline odds.",
    },
    {
      source: pickSource(title, 2),
      ago: pickAgo(title, 2),
      headline:
        h1 % 2 === 0
          ? "Verify primary sources before sizing risk. Review the full market page for depth."
          : "Headlines are context only; book, timeline, and resolutions stay on the market page.",
    },
  ];
}
