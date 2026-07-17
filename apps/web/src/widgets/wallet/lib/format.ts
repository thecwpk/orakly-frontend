/** Compact USD formatter shared by the wallet UI. */
export function compactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(abs >= 10_000 ? 1 : 2)}k`;
  if (abs >= 100) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

export function fullUsd(n: number, opts?: { sign?: boolean }): string {
  const sign = opts?.sign && n > 0 ? "+" : "";
  return `${sign}$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function parseUsd(s: string | number | null | undefined): number {
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  if (!s) return 0;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** `0x1234…abcd` style truncation. */
export function shortAddress(addr: string | null | undefined): string {
  if (!addr) return "N/A";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Compact "time ago" for tx history. */
export function timeAgo(at: string | number | Date, nowMs = Date.now()): string {
  const ms = typeof at === "number" ? at : new Date(at).getTime();
  const diff = Math.max(0, nowMs - ms);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
