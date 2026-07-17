/** Compact USD: `$1.2M`, `$420k`, `$94.20`. */
export function compactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(abs >= 10_000 ? 1 : 2)}k`;
  if (abs >= 100) return `${sign}$${abs.toFixed(0)}`;
  return `${sign}$${abs.toFixed(2)}`;
}

export function compactInt(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toLocaleString();
}

/** `+12.4%` / `−3.0%`. */
export function signedPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "0%";
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(digits)}%`;
}

export function parseDecimal(s: string | number | undefined | null): number {
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  if (!s) return 0;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function shortId(id: string | undefined | null, head = 6, tail = 0): string {
  if (!id) return "N/A";
  if (id.length <= head + tail + 1) return id;
  return tail > 0 ? `${id.slice(0, head)}…${id.slice(-tail)}` : `${id.slice(0, head)}…`;
}
