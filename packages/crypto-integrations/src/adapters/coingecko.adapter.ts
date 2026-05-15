import type { AdapterRuntime } from "../core/adapter-runtime";
import { CryptoIntegrationError } from "../core/integration-error";
import type { NormalizedCryptoAsset } from "../types/normalized";
import { CoinGeckoTrendingSchema } from "./coingecko.schemas";

const BASE = "https://api.coingecko.com/api/v3";
const PID = "coingecko" as const;

const RATE = { key: "coingecko:rest", perMin: 40 };

function parseVol(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parsePct24h(item: {
  data?: { price_change_percentage_24h?: Record<string, unknown> };
}): number | null {
  const p = item.data?.price_change_percentage_24h;
  if (!p || typeof p !== "object") return null;
  const usd = p.usd;
  if (typeof usd === "number") return usd;
  if (typeof usd === "string") {
    const n = Number.parseFloat(usd);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function fetchCoingeckoNormalized(
  rt: AdapterRuntime,
): Promise<NormalizedCryptoAsset[]> {
  const raw = await rt.fetchJson<unknown>(`${BASE}/search/trending`, PID, {
    maxRetries: 3,
    rateBucket: RATE.key,
    rateLimitPerMinute: RATE.perMin,
  });

  const parsed = CoinGeckoTrendingSchema.safeParse(raw);
  if (!parsed.success) {
    throw new CryptoIntegrationError("CoinGecko trending schema mismatch", {
      provider: PID,
      cause: parsed.error,
    });
  }

  const fetchedAt = new Date().toISOString();

  return parsed.data.coins.map(({ item }, idx) => {
    const rankScore = Math.max(0, 100 - idx * 4);
    const vol = parseVol(item.data?.total_volume);
    const volScore = vol ? Math.min(100, Math.log10(vol + 1) * 12) : 0;
    const ch = parsePct24h(item);
    const gainScore =
      ch != null && ch > 0 ? Math.min(100, ch) : 0;

    const dedupeKey = `cg:${item.id.toLowerCase()}`;

    return {
      dedupeKey,
      chainId: null,
      tokenAddress: null,
      coingeckoId: item.id,
      symbol: item.symbol ?? null,
      name: item.name ?? null,
      priceUsd: item.data?.price ?? null,
      liquidityUsd: null,
      volume24hUsd: vol,
      fdvUsd: null,
      change24hPct: ch,
      pairCreatedAtMs: null,
      imageUrl: item.thumb ?? null,
      pairAddress: null,
      dexId: null,
      providers: [PID],
      categoryScores: {
        trending_all: rankScore + 8,
        top_volume: volScore,
        top_gainers: gainScore,
      },
      fetchedAt,
    } satisfies NormalizedCryptoAsset;
  });
}
