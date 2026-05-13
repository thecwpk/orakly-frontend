"use client";

import type { MarketCardVariant } from "./market-card";
import { ShimmerBox } from "@/shared/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

const PADDING: Record<MarketCardVariant, string> = {
  compact: "p-2.5",
  default: "p-3",
  featured: "p-3.5 sm:p-4",
};

export function MarketCardSkeleton({
  variant = "default",
  index = 0,
  className,
}: {
  variant?: MarketCardVariant;
  index?: number;
  className?: string;
}) {
  const isCompact = variant === "compact";
  const d = index * 60;
  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden rounded-lg",
        variant === "featured" && "neon-edge-cyan shadow-[0_0_40px_-16px_rgba(34,211,238,0.35)]",
        PADDING[variant],
        className,
      )}
    >
      {/* header */}
      <div className="flex items-start gap-2">
        <ShimmerBox className="h-4 w-16 rounded-md" delayMs={d} />
        <ShimmerBox className="h-4 w-12 rounded-md" delayMs={d + 60} />
        <ShimmerBox className="ml-auto h-6 w-6 rounded-md" delayMs={d + 30} tone="muted" />
      </div>

      {/* title */}
      <div className="mt-2 space-y-1">
        <ShimmerBox
          className="h-3.5 rounded-md"
          delayMs={d + 80}
          style={{ width: "90%" }}
        />
        <ShimmerBox
          className="h-3.5 rounded-md"
          delayMs={d + 120}
          style={{ width: "62%" }}
          tone="muted"
        />
      </div>

      {/* prob bar + sparkline */}
      <div className={cn("flex items-center gap-2", isCompact ? "mt-2" : "mt-2")}>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <ShimmerBox className="h-2 w-10 rounded-full" tone="muted" />
            <ShimmerBox className="h-3 w-10 rounded-md" />
          </div>
          <ShimmerBox className="h-1.5 w-full rounded-full" tone="muted" />
          <div className="flex items-center justify-between">
            <ShimmerBox className="h-2 w-8 rounded-full" tone="muted" />
            <ShimmerBox className="h-3 w-8 rounded-md" tone="muted" />
          </div>
        </div>
        <ShimmerBox className="h-7 w-16 rounded-md" tone="muted" />
      </div>

      {/* stats */}
      <div className={cn("grid grid-cols-2 gap-1.5", isCompact ? "mt-2" : "mt-2")}>
        <div className="space-y-1.5">
          <ShimmerBox className="h-2.5 w-14 rounded" tone="muted" />
          <ShimmerBox className="h-1 w-full rounded-full" tone="muted" />
        </div>
        <div className="space-y-1.5">
          <ShimmerBox className="h-2.5 w-14 rounded" tone="muted" />
          <ShimmerBox className="h-4 w-20 rounded-md" tone="muted" />
        </div>
      </div>

      {/* trade buttons */}
      {!isCompact ? (
        <div className="mt-2 grid grid-cols-2 gap-1">
          <ShimmerBox className="h-8 rounded-md" tone="muted" />
          <ShimmerBox className="h-8 rounded-md" tone="muted" />
        </div>
      ) : null}
    </div>
  );
}

/** Dense table-row silhouette for `MarketsListSkeleton`-style explorers. */
export function MarketCardRowSkeleton({ index = 0 }: { index?: number }) {
  const d = index * 35;
  return (
    <div
      className={cn(
        "grid items-center gap-3 border-b border-white/[0.04] px-3 py-2.5",
        "[grid-template-columns:34px_minmax(0,1fr)_minmax(0,11rem)_5.5rem_5rem_4.5rem_2.25rem_5rem]",
      )}
    >
      <ShimmerBox className="h-3 w-5 rounded" delayMs={d} tone="muted" />
      <div className="space-y-1.5">
        <ShimmerBox
          className="h-3 rounded"
          delayMs={d + 40}
          style={{ width: `${72 - (index % 4) * 6}%` }}
        />
        <ShimmerBox
          className="h-2 rounded"
          delayMs={d + 80}
          style={{ width: `${36 + (index % 5) * 4}%` }}
          tone="muted"
        />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <ShimmerBox className="h-2 w-8 rounded" tone="muted" />
          <ShimmerBox className="h-2 w-7 rounded" />
        </div>
        <ShimmerBox className="h-1 rounded-full" delayMs={d + 120} tone="muted" />
      </div>
      <ShimmerBox className="ml-auto h-3 w-20 rounded" tone="muted" />
      <div className="ml-auto space-y-1">
        <ShimmerBox className="h-2 w-6 rounded" tone="muted" />
        <ShimmerBox className="h-3 w-12 rounded" />
      </div>
      <div className="ml-auto hidden space-y-1 md:block">
        <ShimmerBox className="h-2 w-6 rounded" tone="muted" />
        <ShimmerBox className="h-3 w-12 rounded" />
      </div>
      <ShimmerBox className="h-4 w-4 rounded" tone="muted" />
      <ShimmerBox className="ml-auto h-6 w-16 rounded" tone="muted" />
    </div>
  );
}

export function MarketCardGridSkeleton({
  count = 8,
  variant = "default",
  className,
}: {
  count?: number;
  variant?: MarketCardVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardSkeleton key={i} index={i} variant={variant} />
      ))}
    </div>
  );
}
