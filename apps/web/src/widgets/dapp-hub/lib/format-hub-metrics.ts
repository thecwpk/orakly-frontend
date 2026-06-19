export function fmtUsdCompact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

export function fmtPct(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function fmtMomentum(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0%";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function fmtCount(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString();
}

/** Polymarket-style price in cents (0–100¢). */
export function fmtCents(probability: number): string {
  if (!Number.isFinite(probability)) return "—";
  const cents = Math.round(Math.min(1, Math.max(0, probability)) * 100);
  return `${cents}¢`;
}
