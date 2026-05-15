import type { AdapterRuntime } from "../core/adapter-runtime";
import type { NormalizedCryptoAsset } from "../types/normalized";

const PID = "coinmarketcap" as const;
const BASE = "https://pro-api.coinmarketcap.com";

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function fetchCoinmarketcapNormalized(
  rt: AdapterRuntime,
): Promise<NormalizedCryptoAsset[]> {
  const key = rt.secrets.coinmarketcapApiKey;
  if (!key) {
    rt.logger?.warn("coinmarketcap.skip_missing_api_key");
    return [];
  }

  const raw = (await rt.fetchJson<Record<string, unknown>>(
    `${BASE}/v1/cryptocurrency/trending/latest`,
    PID,
    {
      maxRetries: 3,
      headers: { "X-CMC_PRO_API_KEY": key },
      rateBucket: "coinmarketcap:trending",
      rateLimitPerMinute: 28,
    },
  )) as Record<string, unknown>;

  const data = raw.data;
  if (!Array.isArray(data)) {
    rt.logger?.warn("coinmarketcap.unexpected_payload_shape");
    return [];
  }

  const fetchedAt = new Date().toISOString();

  return data.map((rowUnknown, idx) => {
    const row = rowUnknown as Record<string, unknown>;
    const sym = typeof row.symbol === "string" ? row.symbol : "";
    const name = typeof row.name === "string" ? row.name : "";
    const id = row.id;
    const quote = row.quote as Record<string, unknown> | undefined;
    const usd = quote?.USD as Record<string, unknown> | undefined;

    const rankScore = Math.max(0, 95 - idx * 5);
    const vol = num(usd?.volume_24h);
    const volScore =
      vol != null ? Math.min(100, Math.log10(vol + 1) * 11) : 0;
    const ch = num(usd?.percent_change_24h);
    const gain = ch != null && ch > 0 ? Math.min(100, ch) : 0;
    const dedupeKey = `cmc:${String(id ?? sym)}`;

    return {
      dedupeKey,
      chainId: null,
      tokenAddress: null,
      coingeckoId: null,
      symbol: sym || null,
      name: name || null,
      priceUsd: num(usd?.price),
      liquidityUsd: null,
      volume24hUsd: vol,
      fdvUsd: null,
      change24hPct: ch,
      pairCreatedAtMs: null,
      imageUrl: null,
      pairAddress: null,
      dexId: null,
      providers: [PID],
      categoryScores: {
        trending_all: rankScore + 10,
        top_volume: volScore,
        top_gainers: gain,
      },
      fetchedAt,
    } satisfies NormalizedCryptoAsset;
  });
}
