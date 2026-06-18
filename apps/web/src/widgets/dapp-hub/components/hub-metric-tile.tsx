"use client";

import { cn } from "@/lib/utils";

export function HubMetricTile({
  label,
  value,
  loading,
  className,
}: {
  label: string;
  value: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("hub-metric-tile", className)}>
      <p className="hub-metric-tile-label">{label}</p>
      {loading ? (
        <div className="hub-skeleton mt-2 h-7 w-16" />
      ) : (
        <p className="hub-metric-value mt-1.5 text-lg sm:text-xl">{value}</p>
      )}
    </div>
  );
}
