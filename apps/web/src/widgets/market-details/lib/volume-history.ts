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

export const VOLUME_WINDOW_HOUR_MS = 3_600_000;

/** Row shape returned by `/api/v1/markets/by-slug/.../volume-window` + client merge. */
export type VolumeChartRow = {
  at: number;
  label: string;
  buy: number;
  sell: number;
  cumulative: number;
};

/**
 * Overlay websocket trades onto server bucket rows without rebuilding the window
 * (avoids client-side `Date.now()` churn).
 */
export function mergeTradesIntoVolumeRows(
  rows: ReadonlyArray<VolumeChartRow>,
  trades: ReadonlyArray<{
    side: "BUY" | "SELL";
    notionalUsd: string;
    at: number;
  }>,
): VolumeChartRow[] {
  if (trades.length === 0) return rows.map((r) => ({ ...r }));
  const next: VolumeChartRow[] = rows.map((r) => ({ ...r }));
  for (const t of trades) {
    const slot = next.findIndex(
      (r) => t.at >= r.at && t.at < r.at + VOLUME_WINDOW_HOUR_MS,
    );
    if (slot < 0) continue;
    const n = Number.parseFloat(t.notionalUsd);
    if (!Number.isFinite(n)) continue;
    const row = next[slot]!;
    if (t.side === "BUY") row.buy += Math.round(n);
    else row.sell += Math.round(n);
  }
  let cumulative = 0;
  for (const row of next) {
    cumulative += row.buy + row.sell;
    row.cumulative = cumulative;
  }
  return next;
}

export function summarizeVolumeChartRows(rows: ReadonlyArray<VolumeChartRow>): {
  totalUsd: number;
  buyUsd: number;
  sellUsd: number;
  imbalance: number;
} {
  let buyUsd = 0;
  let sellUsd = 0;
  for (const r of rows) {
    buyUsd += r.buy;
    sellUsd += r.sell;
  }
  const totalUsd = buyUsd + sellUsd;
  const imbalance = totalUsd > 0 ? (buyUsd - sellUsd) / totalUsd : 0;
  return { totalUsd, buyUsd, sellUsd, imbalance };
}

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
  /**
   * Bucket boundaries use wall-clock time; must stay stable across React renders.
   * Passing fresh `Date.now()` each render interacts badly with Recharts layout + state updates.
   */
  nowMs?: number;
}): VolumeWindow {
  const { slug, totalVolumeUsd, trades, hours = 24, nowMs = Date.now() } = args;
  const seed = hashSlug(slug);
  const now = nowMs;
  const slotStart = (i: number) =>
    Math.floor((now - (hours - 1 - i) * VOLUME_WINDOW_HOUR_MS) / VOLUME_WINDOW_HOUR_MS) *
    VOLUME_WINDOW_HOUR_MS;

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
      if (t.at >= slot && t.at < slot + VOLUME_WINDOW_HOUR_MS) {
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
