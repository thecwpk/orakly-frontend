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
    <div className={cn("hub-card px-4 py-3", className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--hub-muted)]">
        {label}
      </p>
      {loading ? (
        <div className="hub-skeleton mt-2 h-7 w-20" />
      ) : (
        <p className="hub-metric-value mt-1 text-xl">{value}</p>
      )}
    </div>
  );
}
