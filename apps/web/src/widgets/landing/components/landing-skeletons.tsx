"use client";

import { cn } from "@/lib/utils";

export function SkeletonLine({
  className,
  shimmer = true,
}: {
  className?: string;
  shimmer?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md bg-white/6",
        shimmer && "skeleton-shimmer",
        className,
      )}
    />
  );
}

export function SkeletonMarketDenseCard() {
  return (
    <div className="glass-panel flex gap-3 rounded-xl p-3">
      <SkeletonLine className="h-12 w-12 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonLine className="h-3 w-[55%] max-w-[14rem]" />
        <SkeletonLine className="h-3 w-[75%] max-w-[20rem]" />
        <div className="flex gap-2 pt-1">
          <SkeletonLine className="h-5 w-16 rounded-full" />
          <SkeletonLine className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
        <SkeletonLine className="h-6 w-14" />
        <SkeletonLine className="h-2 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMarketDenseCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonActivityList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="glass-panel flex items-center gap-3 rounded-lg px-3 py-2.5">
          <SkeletonLine className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-3 w-full max-w-[18rem]" />
            <SkeletonLine className="h-2 w-24" />
          </div>
          <SkeletonLine className="hidden h-4 w-16 sm:block" />
        </div>
      ))}
    </div>
  );
}
