/** Compact USD formatter shared by the activity feed primitives. */
export function compactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(abs >= 10_000 ? 1 : 2)}k`;
  if (abs >= 100) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

/** Probability → cents string, e.g. `0.6321 → "63.2¢"`. */
export function probToCents(p: number): string {
  return `${(p * 100).toFixed(1)}¢`;
}

export function parseDecimal(s: string | number | null | undefined): number {
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  if (!s) return 0;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
