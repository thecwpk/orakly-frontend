"use client";

import { cn } from "@/lib/utils";
import { SkeletonLine } from "@/widgets/landing/components/landing-skeletons";
import { marketDetailPanelClass } from "./market-detail-section";

function SplitSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 md:gap-4">
      <SkeletonLine className={cn(marketDetailPanelClass, "h-[280px] w-full")} shimmer />
      <SkeletonLine className={cn(marketDetailPanelClass, "h-[280px] w-full")} shimmer />
    </div>
  );
}

export function MarketDetailsSkeleton() {
  return (
    <div className="px-3 py-3 text-zinc-100 sm:px-4 lg:py-4">
      <div className="mx-auto max-w-[min(1440px,100%)]">
        <div className="flex flex-wrap items-center gap-2 pb-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine
              key={i}
              className={`h-7 rounded-md ${i === 0 ? "w-20" : "w-14"}`}
              shimmer
            />
          ))}
          <div className="ml-auto flex gap-1.5">
            <SkeletonLine className="h-7 w-16 rounded-md" shimmer />
            <SkeletonLine className="h-7 w-7 rounded-md" shimmer />
          </div>
        </div>

        <SkeletonLine className="h-6 w-[90%] max-w-2xl rounded-md" shimmer />
        <SkeletonLine className={cn(marketDetailPanelClass, "mt-3 h-[168px] w-full")} shimmer />

        <div className="mt-3 space-y-4 lg:mt-4 lg:space-y-5">
          <SplitSkeleton />
          <SplitSkeleton />
          <SkeletonLine className={cn(marketDetailPanelClass, "h-[220px] w-full")} shimmer />
          <SplitSkeleton />
          <SplitSkeleton />
        </div>
      </div>
    </div>
  );
}
