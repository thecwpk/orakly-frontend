"use client";

import { cn } from "@/lib/utils";

export function TrendingMarketCardSkeleton({
  index = 0,
  compact = false,
}: {
  index?: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-border bg-card",
          "p-3.5 shadow-none sm:p-4",
        )}
      >
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div
            className="skeleton-shimmer h-9 w-9 shrink-0 rounded-md bg-white/[0.05] sm:h-10 sm:w-10"
            style={{ animationDelay: `${index * 60}ms` }}
          />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div
              className="skeleton-shimmer h-3 rounded-md bg-white/[0.06]"
              style={{ width: "100%", animationDelay: `${index * 60 + 40}ms` }}
            />
            <div
              className="skeleton-shimmer h-3 rounded-md bg-white/[0.05]"
              style={{ width: "72%", animationDelay: `${index * 60 + 80}ms` }}
            />
            <div
              className="skeleton-shimmer h-2 w-20 rounded bg-white/[0.04]"
              style={{ animationDelay: `${index * 60 + 100}ms` }}
            />
          </div>
          <div
            className="skeleton-shimmer h-11 w-11 shrink-0 rounded-full bg-white/[0.04]"
            style={{ animationDelay: `${index * 60 + 60}ms` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-2">
          <div
            className="skeleton-shimmer h-9 rounded-md border border-border bg-muted/20"
            style={{ animationDelay: `${index * 60 + 120}ms` }}
          />
          <div
            className="skeleton-shimmer h-9 rounded-md border border-border bg-muted/20"
            style={{ animationDelay: `${index * 60 + 130}ms` }}
          />
        </div>
        <div
          className="skeleton-shimmer mt-2 h-14 w-full rounded-md border border-border bg-muted/15"
          style={{ animationDelay: `${index * 60 + 135}ms` }}
        />
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:gap-2">
          <div
            className="skeleton-shimmer h-8 rounded-md bg-white/[0.04] sm:h-[34px]"
            style={{ animationDelay: `${index * 60 + 140}ms` }}
          />
          <div
            className="skeleton-shimmer h-8 rounded-md bg-white/[0.04] sm:h-[34px]"
            style={{ animationDelay: `${index * 60 + 160}ms` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5 sm:pt-3">
          <div
            className="skeleton-shimmer h-2.5 w-16 rounded bg-white/[0.04]"
            style={{ animationDelay: `${index * 60 + 180}ms` }}
          />
          <div
            className="skeleton-shimmer h-4 w-4 rounded bg-white/[0.04]"
            style={{ animationDelay: `${index * 60 + 200}ms` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/[0.06] bg-[#08080f]/90",
        "p-3",
      )}
    >
      <div className="flex items-start gap-1.5">
        <div
          className="skeleton-shimmer h-3 w-14 rounded bg-white/[0.05]"
          style={{ animationDelay: `${index * 60}ms` }}
        />
        <div
          className="skeleton-shimmer h-3 w-10 rounded bg-white/[0.05]"
          style={{ animationDelay: `${index * 60 + 60}ms` }}
        />
        <div className="ml-auto skeleton-shimmer h-5 w-5 rounded bg-white/[0.04]" />
      </div>

      <div className="mt-2 space-y-1">
        <div
          className={cn("skeleton-shimmer h-3 rounded-md bg-white/[0.05]")}
          style={{ width: "92%", animationDelay: `${index * 60 + 80}ms` }}
        />
        <div
          className={cn("skeleton-shimmer h-3 rounded-md bg-white/[0.04]")}
          style={{ width: "70%", animationDelay: `${index * 60 + 120}ms` }}
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="skeleton-shimmer h-2 w-16 rounded-full bg-white/[0.04]" />
            <div className="skeleton-shimmer h-4 w-12 rounded bg-white/[0.05]" />
          </div>
          <div className="skeleton-shimmer h-1 w-full rounded-full bg-white/[0.04]" />
        </div>
        <div className="skeleton-shimmer h-[22px] w-14 rounded bg-white/[0.04]" />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1">
        <div className="skeleton-shimmer h-8 rounded-md bg-white/[0.03]" />
        <div className="skeleton-shimmer h-8 rounded-md bg-white/[0.03]" />
      </div>
    </div>
  );
}

export function TrendingMarketGridSkeleton({
  count = 18,
  className,
  compact = false,
  /** Hub home browse: dense 4-col terminal grid (matches `HubMarketsBrowseBlock`). */
  preset = "default",
}: {
  count?: number;
  className?: string;
  compact?: boolean;
  preset?: "default" | "hub";
}) {
  const gridPreset =
    preset === "hub"
      ? "grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 md:gap-3 lg:grid-cols-4 lg:gap-3"
      : "grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

  return (
    <div
      className={cn(
        gridPreset,
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <TrendingMarketCardSkeleton key={i} index={i} compact={compact} />
      ))}
    </div>
  );
}
