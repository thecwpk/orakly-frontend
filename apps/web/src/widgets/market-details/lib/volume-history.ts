import { hashSlug } from "./series";

export type VolumeBucket = {
  /** Slot start in ms (top-of-hour). */
  at: number;
  label: string;
  buyUsd: number;
  sellUsd: number;
  totalUsd: number;
  /** Cumulative total vol over the window (running sum). */
  cumulativeUsd: number;
};

export type VolumeWindow = {
  buckets: VolumeBucket[];
  totalUsd: number;
  buyUsd: number;
  sellUsd: number;
  /** -1..+1 — positive = buy-skewed, negative = sell-skewed. */
  imbalance: number;
};

const HOUR_MS = 3_600_000;

/**
 * Build a deterministic 24h-by-hour volume window seeded by slug + total
 * volume. Mixes in any realtime trades for the matching market id, so once a
 * websocket prints a fill the bar visibly grows.
 */
export function buildVolumeWindow(args: {
  slug: string;
  marketId: string | null;
  totalVolumeUsd: number;
  trades: ReadonlyArray<{
    side: "BUY" | "SELL";
    notionalUsd: string;
    at: number;
  }>;
  hours?: number;
}): VolumeWindow {
  const { slug, totalVolumeUsd, trades, hours = 24 } = args;
  const seed = hashSlug(slug);
  const now = Date.now();
  const slotStart = (i: number) =>
    Math.floor((now - (hours - 1 - i) * HOUR_MS) / HOUR_MS) * HOUR_MS;

  // Seed each hour with a deterministic synthetic volume that sums to ~v24.
  const v24 = Math.max(1, totalVolumeUsd * 0.08);

  const weights: number[] = [];
  let totalWeight = 0;
  for (let i = 0; i < hours; i++) {
    const wave = 0.55 + Math.sin((i / 5 + (seed % 11)) * 0.7) * 0.35;
    const jitter = (((seed >> (i * 3)) & 255) / 255) * 0.45;
    const w = Math.max(0.05, wave + jitter);
    weights.push(w);
    totalWeight += w;
  }

  const buckets: VolumeBucket[] = [];
  let cumulative = 0;

  for (let i = 0; i < hours; i++) {
    const w = weights[i] ?? 0;
    const total = (w / Math.max(0.0001, totalWeight)) * v24;

    // Buy/sell synthesized split — tilt by hour parity to look organic.
    const skew = 0.45 + (((seed >> (i + 4)) & 255) / 255) * 0.2;
    let buy = total * skew;
    let sell = total - buy;

    // Layer real trades that fall into this hour's slot.
    const slot = slotStart(i);
    for (const t of trades) {
      if (t.at >= slot && t.at < slot + HOUR_MS) {
        const n = Number.parseFloat(t.notionalUsd);
        if (!Number.isFinite(n)) continue;
        if (t.side === "BUY") buy += n;
        else sell += n;
      }
    }

    const totalActual = buy + sell;
    cumulative += totalActual;

    buckets.push({
      at: slot,
      label: formatHourLabel(slot),
      buyUsd: Math.max(0, buy),
      sellUsd: Math.max(0, sell),
      totalUsd: totalActual,
      cumulativeUsd: cumulative,
    });
  }

  const buy = buckets.reduce((s, b) => s + b.buyUsd, 0);
  const sell = buckets.reduce((s, b) => s + b.sellUsd, 0);
  const total = buy + sell;
  const imbalance = total > 0 ? (buy - sell) / total : 0;

  return { buckets, totalUsd: total, buyUsd: buy, sellUsd: sell, imbalance };
}

function formatHourLabel(slotMs: number): string {
  const d = new Date(slotMs);
  const h = d.getHours();
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}
