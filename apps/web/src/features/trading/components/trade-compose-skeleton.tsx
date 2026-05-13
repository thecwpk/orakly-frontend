"use client";

import { ShimmerBox } from "@/shared/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

/** Mirrors `TradeComposePanel` layout for initial wallet / quote hydration. */
export function TradeComposeSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col gap-4", className)}
      aria-hidden
    >
      <div className="grid grid-cols-2 gap-2">
        <ShimmerBox className="h-14 rounded-xl" delayMs={0} />
        <ShimmerBox className="h-14 rounded-xl" delayMs={40} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          <ShimmerBox className="h-8 w-[72px] rounded-md" delayMs={60} />
          <ShimmerBox className="h-8 w-[72px] rounded-md" delayMs={80} />
        </div>
        <ShimmerBox className="h-8 w-[120px] rounded-md" delayMs={100} />
      </div>

      <div className="space-y-2">
        <ShimmerBox className="h-3 w-28 rounded-full" delayMs={90} />
        <ShimmerBox className="h-16 w-full rounded-xl" delayMs={110} tone="panel" />
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <ShimmerBox key={i} className="h-7 w-11 rounded-md" delayMs={120 + i * 25} />
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-xl bg-black/30 px-3.5 py-3 ring-1 ring-white/[0.06]">
        <ShimmerBox className="h-3 w-36 rounded-full" delayMs={130} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between gap-3">
            <ShimmerBox className="h-3 w-24 rounded" delayMs={140 + i * 30} />
            <ShimmerBox className="h-3 w-20 rounded" delayMs={150 + i * 30} />
          </div>
        ))}
      </div>

      <ShimmerBox className="h-11 w-full rounded-xl" delayMs={200} />
    </div>
  );
}
