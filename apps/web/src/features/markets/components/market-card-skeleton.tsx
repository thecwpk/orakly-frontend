"use client";

import type { MarketCardVariant } from "./market-card";
import { ShimmerBox } from "@/shared/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

export function MarketCardSkeleton({
  variant = "default",
  index = 0,
  className,
}: {
  variant?: MarketCardVariant;
  index?: number;
  className?: string;
}) {
  const d = index * 60;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-card)]",
        className,
      )}
    >
      <ShimmerBox className="h-20 w-full rounded-none" delayMs={d} tone="muted" />
      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          <ShimmerBox className="h-3.5 w-[92%] rounded-md" delayMs={d + 40} />
          <ShimmerBox className="h-3.5 w-[64%] rounded-md" delayMs={d + 80} tone="muted" />
        </div>
        <ShimmerBox className="h-5 w-24 rounded" delayMs={d + 100} tone="muted" />
        <div className="space-y-1.5">
          <ShimmerBox className="h-3 w-full rounded-md" delayMs={d + 120} />
          <ShimmerBox className="h-1.5 w-full rounded-full" delayMs={d + 140} tone="muted" />
          <ShimmerBox className="h-3 w-full rounded-md" delayMs={d + 160} />
        </div>
        <div className="flex gap-3">
          <ShimmerBox className="h-3 w-14 rounded" delayMs={d + 180} tone="muted" />
          <ShimmerBox className="h-3 w-14 rounded" delayMs={d + 200} tone="muted" />
          <ShimmerBox className="h-3 w-16 rounded" delayMs={d + 220} tone="muted" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ShimmerBox className="h-9 w-full rounded-lg" delayMs={d + 240} />
          <ShimmerBox className="h-9 w-full rounded-lg" delayMs={d + 260} />
        </div>
      </div>
    </div>
  );
}

export function MarketCardRowSkeleton({ index = 0 }: { index?: number }) {
  return <MarketCardSkeleton index={index} />;
}

export function MarketCardGridSkeleton({
  count = 6,
  variant = "default",
}: {
  count?: number;
  variant?: MarketCardVariant;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} index={i} variant={variant} />
      ))}
    </div>
  );
}
