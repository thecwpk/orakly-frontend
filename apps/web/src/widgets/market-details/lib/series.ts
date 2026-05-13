/** Deterministic pseudo-history for demo / seed markets (replace with OHLC API). */
export function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type ImpliedPoint = { label: string; yes: number };

export function buildImpliedHistory(
  slug: string,
  midYes: number,
  points = 48,
): ImpliedPoint[] {
  const seed = hashSlug(slug);
  const rows: ImpliedPoint[] = [];
  let y = Math.min(0.97, Math.max(0.03, midYes));
  for (let i = points - 1; i >= 0; i--) {
    const wave = Math.sin((i / 8 + seed % 7) * 0.9) * 0.012;
    const jitter = (((seed >> (i % 23)) & 255) / 255 - 0.5) * 0.018;
    y = Math.min(0.99, Math.max(0.01, y + wave * 0.25 + jitter));
    rows.push({
      label:
        i % 6 === 0 ? `${points - 1 - i}m`
        : "",
      yes: y,
    });
  }
  if (rows.length > 0) {
    rows[rows.length - 1] = { ...rows[rows.length - 1]!, yes: midYes };
  }
  return rows;
}

export type VolumePoint = { label: string; vol: number };

export function buildVolumeHistory(volumeUsd: number, slug: string): VolumePoint[] {
  const seed = hashSlug(slug);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((label, i) => {
    const f = 0.55 + (((seed >> (i * 3)) & 255) / 255) * 0.9;
    return { label, vol: Math.max(1, volumeUsd * f * 0.02) };
  });
}
