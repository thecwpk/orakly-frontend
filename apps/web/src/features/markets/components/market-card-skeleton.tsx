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
        "overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <ShimmerBox className="size-9 shrink-0 rounded-lg" delayMs={d} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <ShimmerBox className="h-3.5 w-[92%] rounded-md" delayMs={d + 40} />
          <ShimmerBox className="h-3.5 w-[64%] rounded-md" delayMs={d + 80} tone="muted" />
        </div>
        <div className="space-y-1">
          <ShimmerBox className="h-5 w-10 rounded-md" delayMs={d + 60} />
          <ShimmerBox className="h-2.5 w-10 rounded" delayMs={d + 90} tone="muted" />
        </div>
      </div>
      <ShimmerBox className="mt-3 h-1.5 w-full rounded-full" delayMs={d + 120} tone="muted" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ShimmerBox className="h-10 w-full rounded-lg" delayMs={d + 160} />
        <ShimmerBox className="h-10 w-full rounded-lg" delayMs={d + 180} />
      </div>
      <div className="mt-3 flex gap-2 border-t border-[var(--border)] pt-2.5">
        <ShimmerBox className="h-3 w-12 rounded" delayMs={d + 200} tone="muted" />
        <ShimmerBox className="h-3 w-16 rounded" delayMs={d + 220} tone="muted" />
        <ShimmerBox className="h-3 w-14 rounded" delayMs={d + 240} tone="muted" />
      </div>
      {variant === "featured" ? null : null}
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} index={i} variant={variant} />
      ))}
    </div>
  );
}
