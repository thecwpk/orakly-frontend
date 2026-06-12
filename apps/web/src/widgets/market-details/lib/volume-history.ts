export type VolumeBucket = {
  at: number;
  label: string;
  buyUsd: number;
  sellUsd: number;
  totalUsd: number;
  cumulativeUsd: number;
};

export type VolumeWindow = {
  buckets: VolumeBucket[];
  totalUsd: number;
  buyUsd: number;
  sellUsd: number;
  imbalance: number;
};

export const VOLUME_WINDOW_HOUR_MS = 3_600_000;

export type VolumeChartRow = {
  at: number;
  label: string;
  buy: number;
  sell: number;
  cumulative: number;
};

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

function formatHourLabel(slotMs: number): string {
  const d = new Date(slotMs);
  const h = d.getHours();
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}

/** 24h hourly buckets from real trade prints only. */
export function buildVolumeWindow(args: {
  trades: ReadonlyArray<{
    side: "BUY" | "SELL";
    notionalUsd: string;
    at: number;
  }>;
  hours?: number;
  nowMs?: number;
}): VolumeWindow {
  const { trades, hours = 24, nowMs = Date.now() } = args;
  const now = nowMs;
  const slotStart = (i: number) =>
    Math.floor((now - (hours - 1 - i) * VOLUME_WINDOW_HOUR_MS) / VOLUME_WINDOW_HOUR_MS) *
    VOLUME_WINDOW_HOUR_MS;

  const buckets: VolumeBucket[] = [];
  let cumulative = 0;

  for (let i = 0; i < hours; i++) {
    const slot = slotStart(i);
    let buy = 0;
    let sell = 0;

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
