/** Compact USD: `$1.2M`, `$420k`, `$94`. */
export function compactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000)
    return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
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

/** `0xab12...7e4f` truncation for public profiles. */
export function shortAddress(addr: string): string {
  if (!addr) return "N/A";
  if (addr.length <= 12) return addr;
  if (addr.includes("…") || addr.includes("...")) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Compact "time ago" formatter. */
export function timeAgo(at: string | number, nowMs = Date.now()): string {
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
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

export function formatJoined(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}
