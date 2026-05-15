import type { z } from "zod";
import { chunkArray } from "../core/chunk";
import type { AdapterRuntime } from "../core/adapter-runtime";
import { CryptoIntegrationError } from "../core/integration-error";
import {
  CRYPTO_SIGNAL_CATEGORIES,
  type CryptoMarketCategory,
} from "../types/categories";
import type { NormalizedCryptoAsset } from "../types/normalized";
import {
  DexBoostResponseSchema,
  DexPairSchema,
  DexPairsResponseSchema,
} from "./dexscreener.schemas";

type DexPair = z.infer<typeof DexPairSchema>;

const BASE = "https://api.dexscreener.com";
const PID = "dexscreener" as const;

const RATE_BOOSTS = { key: "dexscreener:boosts", perMin: 55 };
const RATE_PAIRS = { key: "dexscreener:pairs", perMin: 280 };
const BATCH = 30;

function parseUsd(value: string | number | undefined): number | null {
  if (value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function boostAmount(row: { totalAmount?: number; amount?: number }): number {
  return row.totalAmount ?? row.amount ?? 0;
}

function pickBestPair(pairs: DexPair[], tokenAddress: string): DexPair | null {
  const addr = tokenAddress.toLowerCase();
  const candidates = pairs.filter(
    (p) => p.baseToken.address.toLowerCase() === addr,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, cur) => {
    const bl = best.liquidity?.usd ?? 0;
    const cl = cur.liquidity?.usd ?? 0;
    return cl >= bl ? cur : best;
  });
}

function pumpHeuristic(chainId: string, tokenAddress: string): boolean {
  const a = tokenAddress.toLowerCase();
  return chainId === "solana" && a.endsWith("pump");
}

function volumeScore(vol: number | null): number {
  if (vol == null || vol <= 0) return 0;
  return Math.min(100, Math.log10(vol + 1) * 14);
}

function newListingScore(pairCreatedAtMs: number | null, now: number): number {
  if (pairCreatedAtMs == null) return 0;
  const ageDays = (now - pairCreatedAtMs) / 86_400_000;
  if (ageDays > 14) return 0;
  return Math.max(0, 100 - ageDays * 7);
}

function gainerScore(pct: number | null): number {
  if (pct == null || pct <= 0) return 0;
  return Math.min(100, pct);
}

function buildCategoryScores(args: {
  boost: number;
  volume24h: number | null;
  change24h: number | null;
  pairCreatedAtMs: number | null;
  chainId: string;
  tokenAddress: string;
  now: number;
}): Partial<Record<CryptoMarketCategory, number>> {
  const trendingSignal = Math.min(100, args.boost / 6 + 15);
  const vol = volumeScore(args.volume24h);
  const gain = gainerScore(args.change24h);
  const nl = newListingScore(args.pairCreatedAtMs, args.now);
  const pump = pumpHeuristic(args.chainId, args.tokenAddress) ? 72 : 0;

  const scores: Partial<Record<CryptoMarketCategory, number>> = {
    trending_all: trendingSignal,
    top_volume: vol,
    top_gainers: gain,
    new_listings: nl,
    memecoin_pump: pump > 0 ? pump + trendingSignal * 0.25 : 0,
  };

  for (const c of CRYPTO_SIGNAL_CATEGORIES) {
    const v = scores[c];
    if (v !== undefined && v < 0.25) delete scores[c];
  }
  return scores;
}

export async function fetchDexscreenerNormalized(
  rt: AdapterRuntime,
  options: { limit?: number } = {},
): Promise<NormalizedCryptoAsset[]> {
  const limit = Math.min(Math.max(options.limit ?? 28, 1), 60);
  const now = Date.now();

  const rawBoosts = await rt.fetchJson<unknown>(`${BASE}/token-boosts/top/v1`, PID, {
    maxRetries: 3,
    rateBucket: RATE_BOOSTS.key,
    rateLimitPerMinute: RATE_BOOSTS.perMin,
  });

  const parsed = DexBoostResponseSchema.safeParse(rawBoosts);
  if (!parsed.success) {
    throw new CryptoIntegrationError("Dexscreener boosts schema mismatch", {
      provider: PID,
      cause: parsed.error,
    });
  }

  const ranked = [...parsed.data]
    .sort((a, b) => boostAmount(b) - boostAmount(a))
    .slice(0, limit);

  const grouped = new Map<string, string[]>();
  for (const row of ranked) {
    const list = grouped.get(row.chainId) ?? [];
    list.push(row.tokenAddress);
    grouped.set(row.chainId, list);
  }

  const pairByToken = new Map<string, DexPair>();

  for (const [, addresses] of grouped) {
    for (const batch of chunkArray(addresses, BATCH)) {
      const path = encodeURIComponent(batch.join(","));
      const rawPairs = await rt.fetchJson<unknown>(
        `${BASE}/latest/dex/tokens/${path}`,
        PID,
        {
          maxRetries: 3,
          rateBucket: RATE_PAIRS.key,
          rateLimitPerMinute: RATE_PAIRS.perMin,
        },
      );

      const parsedPairs = DexPairsResponseSchema.safeParse(rawPairs);
      if (!parsedPairs.success) continue;

      for (const addr of batch) {
        const best = pickBestPair(parsedPairs.data.pairs, addr);
        if (best) pairByToken.set(addr.toLowerCase(), best);
      }
    }
  }

  const fetchedAt = new Date().toISOString();

  return ranked.map((row) => {
    const pair = pairByToken.get(row.tokenAddress.toLowerCase());
    const boost = boostAmount(row);
    const volume24h = pair?.volume?.h24 ?? null;
    const change24h = pair?.priceChange?.h24 ?? null;
    const pairCreatedAtMs = pair?.pairCreatedAt ?? null;

    const chainId = row.chainId;
    const tokenAddress = row.tokenAddress;
    const dedupeKey = `${chainId}:${tokenAddress}`.toLowerCase();

    const headerImage =
      typeof row.header === "string" && row.header.startsWith("http")
        ? row.header
        : null;

    const categoryScores = buildCategoryScores({
      boost,
      volume24h,
      change24h,
      pairCreatedAtMs,
      chainId,
      tokenAddress,
      now,
    });

    return {
      dedupeKey,
      chainId,
      tokenAddress,
      coingeckoId: null,
      symbol: pair?.baseToken.symbol ?? null,
      name: pair?.baseToken.name ?? null,
      priceUsd: parseUsd(pair?.priceUsd),
      liquidityUsd: pair?.liquidity?.usd ?? null,
      volume24hUsd: volume24h,
      fdvUsd: pair?.fdv ?? null,
      change24hPct: change24h,
      pairCreatedAtMs,
      imageUrl: pair?.info?.imageUrl ?? headerImage,
      pairAddress: pair?.pairAddress ?? null,
      dexId: pair?.dexId ?? null,
      providers: [PID],
      categoryScores,
      fetchedAt,
    } satisfies NormalizedCryptoAsset;
  });
}
