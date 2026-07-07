export const VIRTUAL_LIQUIDITY_USDT = 1000;

export function stabilizeProbability(
  currentProbability: number,
  realVolumeUsd: number,
): number {
  const vol = Math.max(0, realVolumeUsd);
  const numerator =
    currentProbability * vol + 0.5 * VIRTUAL_LIQUIDITY_USDT;
  const denominator = vol + VIRTUAL_LIQUIDITY_USDT;
  if (denominator <= 0) return 0.5;
  return Math.min(1, Math.max(0, numerator / denominator));
}
