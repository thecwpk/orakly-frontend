const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatCompactUsd(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${numberFormatter.format(value / 1_000_000_000)}B`;
  }

  if (value >= 1_000_000) {
    return `$${numberFormatter.format(value / 1_000_000)}M`;
  }

  if (value >= 1_000) {
    return `$${numberFormatter.format(value / 1_000)}K`;
  }

  return `$${numberFormatter.format(value)}`;
}
