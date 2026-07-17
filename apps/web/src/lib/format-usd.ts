export function formatUsdCompact(value: number): string {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1 ? 0 : 4,
  }).format(value);
}
