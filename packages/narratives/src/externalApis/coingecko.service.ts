import { cacheGet, cacheSet } from "../lib/cache.js";
import {
  COINGECKO_CATEGORY_MAP,
  NEWS_KEYWORD_MAP,
  type NarrativeKey,
} from "../lib/constants.js";
import { fetchJsonWithRetry } from "../lib/http-client.js";

const BASE = "https://api.coingecko.com/api/v3";
const SOURCE = "coingecko";

export type CoingeckoNarrativeRow = {
  source: "coingecko";
  narrative: string;
  volume: number;
  momentum: number;
};

type TrendingResponse = {
  coins?: Array<{
    item?: {
      id?: string;
      name?: string;
      symbol?: string;
      data?: {
        total_volume?: string | number;
        price_change_percentage_24h?: { usd?: number | string };
      };
    };
  }>;
};

type CategoryRow = {
  id?: string;
  name?: string;
  market_cap?: number;
  volume_24h?: number;
  market_cap_change_24h?: number;
};

type GlobalResponse = {
  data?: {
    total_market_cap?: Record<string, number>;
    market_cap_change_percentage_24h_usd?: number;
    total_volume?: Record<string, number>;
  };
};

function parseNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function inferNarrativeFromText(text: string): NarrativeKey | null {
  for (const row of NEWS_KEYWORD_MAP) {
    if (row.pattern.test(text)) return row.narrative;
  }
  return null;
}

function emptyRows(): CoingeckoNarrativeRow[] {
  return [];
}

async function fetchCached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit) return hit;
  const fresh = await fn();
  await cacheSet(key, fresh);
  return fresh;
}

function upsertRow(
  map: Map<string, CoingeckoNarrativeRow>,
  narrative: string,
  volume: number,
  momentum: number,
): void {
  const prev = map.get(narrative);
  if (!prev) {
    map.set(narrative, { source: SOURCE, narrative, volume, momentum });
    return;
  }
  map.set(narrative, {
    source: SOURCE,
    narrative,
    volume: prev.volume + volume,
    momentum: Math.max(prev.momentum, momentum),
  });
}

function normalizeRows(map: Map<string, CoingeckoNarrativeRow>): CoingeckoNarrativeRow[] {
  const rows = [...map.values()];
  if (rows.length === 0) return emptyRows();

  const maxVol = Math.max(...rows.map((r) => r.volume), 1);
  const maxMom = Math.max(...rows.map((r) => r.momentum), 1);

  return rows.map((r) => ({
    ...r,
    volume: Number(((r.volume / maxVol) * 100).toFixed(4)),
    momentum: Number(((r.momentum / maxMom) * 100).toFixed(4)),
  }));
}

export async function getTrendingCoins(): Promise<CoingeckoNarrativeRow[]> {
  return fetchCached("coingecko:trending", async () => {
    const { data } = await fetchJsonWithRetry<TrendingResponse>(
      `${BASE}/search/trending`,
      SOURCE,
    );

    const map = new Map<string, CoingeckoNarrativeRow>();

    for (const [idx, coin] of (data.coins ?? []).entries()) {
      const item = coin.item;
      if (!item) continue;

      const label = `${item.name ?? ""} ${item.symbol ?? ""} ${item.id ?? ""}`;
      const narrative = inferNarrativeFromText(label);
      if (!narrative) continue;

      const vol = parseNum(item.data?.total_volume);
      const ch = parseNum(item.data?.price_change_percentage_24h?.usd);
      const rankBoost = Math.max(0, 100 - idx * 8);
      const momentum = Math.max(0, ch) + rankBoost * 0.25;

      upsertRow(map, narrative, vol, momentum);
    }

    return normalizeRows(map);
  });
}

export async function getCategories(): Promise<CoingeckoNarrativeRow[]> {
  return fetchCached("coingecko:categories", async () => {
    const { data } = await fetchJsonWithRetry<CategoryRow[]>(
      `${BASE}/coins/categories`,
      SOURCE,
    );

    const map = new Map<string, CoingeckoNarrativeRow>();

    for (const cat of data ?? []) {
      const narrative = cat.id ? COINGECKO_CATEGORY_MAP[cat.id] : undefined;
      if (!narrative) continue;

      const vol = parseNum(cat.volume_24h);
      const momentum = Math.abs(parseNum(cat.market_cap_change_24h));
      upsertRow(map, narrative, vol, momentum);
    }

    return normalizeRows(map);
  });
}

export async function getGlobalMarketData(): Promise<CoingeckoNarrativeRow[]> {
  return fetchCached("coingecko:global", async () => {
    const { data } = await fetchJsonWithRetry<GlobalResponse>(
      `${BASE}/global`,
      SOURCE,
    );

    const globalChange = parseNum(data.data?.market_cap_change_percentage_24h_usd);
    const totalVol = parseNum(data.data?.total_volume?.usd);

    return [
      {
        source: SOURCE,
        narrative: "DeFi",
        volume: 100,
        momentum: Math.min(100, Math.abs(globalChange) * 4),
      },
      {
        source: SOURCE,
        narrative: "Memes",
        volume: Math.min(100, totalVol > 0 ? Math.log10(totalVol) * 8 : 0),
        momentum: Math.min(100, Math.abs(globalChange) * 2.5),
      },
    ];
  });
}

export async function getAllCoingeckoNarratives(): Promise<CoingeckoNarrativeRow[]> {
  const [trending, categories, global] = await Promise.all([
    getTrendingCoins(),
    getCategories(),
    getGlobalMarketData(),
  ]);

  const map = new Map<string, CoingeckoNarrativeRow>();

  for (const row of [...trending, ...categories, ...global]) {
    const prev = map.get(row.narrative);
    if (!prev) {
      map.set(row.narrative, { ...row });
      continue;
    }
    map.set(row.narrative, {
      source: SOURCE,
      narrative: row.narrative,
      volume: (prev.volume + row.volume) / 2,
      momentum: (prev.momentum + row.momentum) / 2,
    });
  }

  return [...map.values()];
}
