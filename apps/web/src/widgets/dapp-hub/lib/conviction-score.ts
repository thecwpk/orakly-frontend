/** Crowd conviction — distance from 50/50 implied probability (0–100). */
export function marketConvictionScore(probability: number): number {
  if (!Number.isFinite(probability)) return 0;
  const p = Math.min(0.99, Math.max(0.01, probability));
  return Math.round(Math.abs(p - 0.5) * 2 * 100);
}
