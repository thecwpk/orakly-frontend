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

/** Use live history when it moves; otherwise deterministic wiggle for visible chart curves. */
export function buildFeaturedSparkSeries(
  marketId: string,
  probability: number,
  history: readonly number[],
): number[] {
  if (history.length >= 4) {
    const lo = Math.min(...history);
    const hi = Math.max(...history);
    if (hi - lo > 0.008) return [...history];
  }

  const anchor = clampProb(probability);
  const h = hashU32(marketId);
  const amp = 0.035 + (h % 25) / 1000;
  const n = 18;

  return Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(1, n - 1);
    const wave =
      Math.sin(t * Math.PI * 2.4 + (h % 80) / 40) * amp +
      Math.sin(t * Math.PI * 5.1 + (h % 40) / 20) * amp * 0.35;
    const drift = (t - 0.45) * amp * 0.5;
    return clampProb(anchor + wave + drift);
  });
}
