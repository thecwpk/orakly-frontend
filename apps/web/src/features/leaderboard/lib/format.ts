/** Compact USD formatter — `$1.2M`, `$420k`, `$94`. */
export function compactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(abs >= 10_000 ? 1 : 2)}k`;
  if (abs >= 100) return `${sign}$${abs.toFixed(0)}`;
  return `${sign}$${abs.toFixed(2)}`;
}

/** `+$1.20M` / `−$320k`. */
export function signedCompactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  return `${n > 0 ? "+" : "−"}${compactUsd(Math.abs(n))}`;
}

/** `+12.4%` / `−3.0%`. */
export function signedPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "0%";
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(digits)}%`;
}

/** `0xab12…7e4f` truncation. */
export function shortAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  // Address samples already include `…` — keep the existing display when so.
  if (addr.includes("…")) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
