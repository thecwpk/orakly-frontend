import { cacheGet, cacheSet } from "../lib/cache.js";
import { DEFILLAMA_CHAIN_MAP } from "../lib/constants.js";
import { fetchJsonWithRetry } from "../lib/http-client.js";

const SOURCE = "defillama";
const CHAINS_URL = "https://api.llama.fi/v2/chains";
const PROTOCOLS_URL = "https://api.llama.fi/protocols";

export type DefiLlamaNarrativeRow = {
  narrative: string;
  tvlGrowthPercent: number;
};

type ChainRow = {
  name?: string;
  tvl?: number;
  change_1d?: number;
  change_7d?: number;
};

type ProtocolRow = {
  name?: string;
  category?: string;
  chain?: string;
  chains?: string[];
  change_1d?: number;
  change_7d?: number;
  tvl?: number;
};

function parsePct(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return 0;
}

async function getPreviousTvl(key: string, current: number): Promise<number> {
  const prev = await cacheGet<number>(`defillama:prev:${key}`);
  await cacheSet(`defillama:prev:${key}`, current, 24 * 60 * 60 * 1000);
  return prev ?? current;
}

function growthPct(current: number, previous: number): number {
  if (previous <= 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(4));
}

export async function getChainsTVL(): Promise<DefiLlamaNarrativeRow[]> {
  const cached = await cacheGet<DefiLlamaNarrativeRow[]>("defillama:chains");
  if (cached) return cached;

  const { data } = await fetchJsonWithRetry<ChainRow[]>(CHAINS_URL, SOURCE);
  const byNarrative = new Map<string, number[]>();

  for (const chain of data ?? []) {
    const narrative = chain.name ? DEFILLAMA_CHAIN_MAP[chain.name] : undefined;
    if (!narrative) continue;

    const tvl = chain.tvl ?? 0;
    const prev = await getPreviousTvl(`chain:${chain.name}`, tvl);
    const pct = growthPct(tvl, prev);
    const day = parsePct(chain.change_1d);
    const blended = pct !== 0 ? pct : day;

    const arr = byNarrative.get(narrative) ?? [];
    arr.push(blended);
    byNarrative.set(narrative, arr);
  }

  const rows = [...byNarrative.entries()].map(([narrative, values]) => ({
    narrative,
    tvlGrowthPercent: Number(
      (values.reduce((a, b) => a + b, 0) / values.length).toFixed(4),
    ),
  }));

  await cacheSet("defillama:chains", rows);
  return rows;
}

export async function getProtocolsTVL(): Promise<DefiLlamaNarrativeRow[]> {
  const cached = await cacheGet<DefiLlamaNarrativeRow[]>("defillama:protocols");
  if (cached) return cached;

  const { data } = await fetchJsonWithRetry<ProtocolRow[]>(PROTOCOLS_URL, SOURCE);
  const byNarrative = new Map<string, number[]>();

  for (const protocol of data ?? []) {
    const chainName = protocol.chain ?? protocol.chains?.[0];
    const narrative = chainName ? DEFILLAMA_CHAIN_MAP[chainName] : "DeFi";
    if (!narrative) continue;

    const tvl = protocol.tvl ?? 0;
    const key = `protocol:${protocol.name ?? chainName}`;
    const prev = await getPreviousTvl(key, tvl);
    const pct = growthPct(tvl, prev);
    const day = parsePct(protocol.change_1d);
    const blended = pct !== 0 ? pct : day;

    const arr = byNarrative.get(narrative) ?? [];
    arr.push(blended);
    byNarrative.set(narrative, arr);
  }

  const rows = [...byNarrative.entries()].map(([narrative, values]) => ({
    narrative,
    tvlGrowthPercent: Number(
      (values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1)).toFixed(4),
    ),
  }));

  await cacheSet("defillama:protocols", rows);
  return rows;
}

export async function getAllDefiLlamaNarratives(): Promise<DefiLlamaNarrativeRow[]> {
  const [chains, protocols] = await Promise.all([
    getChainsTVL(),
    getProtocolsTVL(),
  ]);

  const map = new Map<string, DefiLlamaNarrativeRow>();

  for (const row of [...chains, ...protocols]) {
    const prev = map.get(row.narrative);
    if (!prev) {
      map.set(row.narrative, row);
      continue;
    }
    map.set(row.narrative, {
      narrative: row.narrative,
      tvlGrowthPercent: (prev.tvlGrowthPercent + row.tvlGrowthPercent) / 2,
    });
  }

  return [...map.values()];
}
