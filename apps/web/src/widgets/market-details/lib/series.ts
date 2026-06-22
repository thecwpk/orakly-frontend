/** Chart series — API snapshots with synthetic fallback for visible curves. */

export type ImpliedPoint = { label: string; yes: number };

function hashU32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clampProb(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  return Math.min(0.98, Math.max(0.02, v));
}

function formatSnapLabel(iso: string, index: number, total: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return index === total - 1 ? "Now" : "";
  if (total <= 8 || index % Math.ceil(total / 6) === 0 || index === total - 1) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return "";
}

function buildSyntheticImpliedHistory(seed: string, midYes: number, points = 16): ImpliedPoint[] {
  const anchor = clampProb(midYes);
  const h = hashU32(seed);
  const amp = 0.04 + (h % 30) / 1000;
  const n = Math.max(8, points);

  return Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(1, n - 1);
    const wave =
      Math.sin(t * Math.PI * 2.3 + (h % 70) / 35) * amp +
      Math.sin(t * Math.PI * 4.8 + (h % 40) / 20) * amp * 0.35;
    const drift = (t - 0.42) * amp * 0.55;
    const yes = clampProb(anchor + wave + drift);
    const label =
      i === 0 ? "" : i === n - 1 ? "Now" : i % 3 === 0 ? `${Math.round(t * 100)}%` : "";
    return { label, yes };
  });
}

export function buildImpliedHistoryFromSnapshots(
  seed: string,
  midYes: number,
  snapshots: readonly { yes: number; recordedAt: string }[],
): ImpliedPoint[] {
  if (snapshots.length >= 3) {
    const vals = snapshots.map((s) => clampProb(s.yes));
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    if (hi - lo > 0.006) {
      return snapshots.map((s, i) => ({
        label: formatSnapLabel(s.recordedAt, i, snapshots.length),
        yes: clampProb(s.yes),
      }));
    }
  }

  return buildSyntheticImpliedHistory(seed, midYes);
}

/** @deprecated Use buildImpliedHistoryFromSnapshots — kept for volume helpers. */
export function buildImpliedHistory(midYes: number): ImpliedPoint[] {
  const y = clampProb(midYes);
  return buildSyntheticImpliedHistory("fallback", y, 12);
}

export type VolumePoint = { label: string; vol: number };

export function buildVolumeHistory(volumeUsd: number): VolumePoint[] {
  const v = Math.max(0, volumeUsd);
  if (v <= 0) {
    return [
      { label: "18h", vol: 0 },
      { label: "12h", vol: 0 },
      { label: "6h", vol: 0 },
      { label: "Now", vol: 0 },
    ];
  }
  const h = hashU32(String(v));
  return ["18h", "12h", "6h", "Now"].map((label, i) => {
    const frac = 0.55 + ((h >> (i * 5)) % 40) / 100;
    return { label, vol: Math.round(v * frac) };
  });
}

export function impliedYDomain(points: readonly ImpliedPoint[]): [number, number] {
  if (!points.length) return [0, 100];
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of points) {
    const pct = p.yes * 100;
    lo = Math.min(lo, pct);
    hi = Math.max(hi, pct);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 100];
  if (lo === hi) {
    return [Math.max(0, lo - 8), Math.min(100, hi + 8)];
  }
  const pad = Math.max(4, (hi - lo) * 0.25);
  return [Math.max(0, lo - pad), Math.min(100, hi + pad)];
}
