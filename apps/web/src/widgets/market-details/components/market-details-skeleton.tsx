"use client";

import { cn } from "@/lib/utils";
import { SkeletonLine } from "@/widgets/landing/components/landing-skeletons";
import { marketDetailPanelClass } from "./market-detail-section";

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

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-4">
          <div className="space-y-3">
            <SkeletonLine className={cn(marketDetailPanelClass, "h-[168px] w-full")} shimmer />
            <SkeletonLine className={cn(marketDetailPanelClass, "h-[200px] w-full")} shimmer />
            <div className="grid gap-3 md:grid-cols-2">
              <SkeletonLine className={cn(marketDetailPanelClass, "h-[200px] w-full")} shimmer />
              <SkeletonLine className={cn(marketDetailPanelClass, "h-[200px] w-full")} shimmer />
            </div>
            <SkeletonLine className={cn(marketDetailPanelClass, "h-[220px] w-full")} shimmer />
            <div className="grid gap-3 md:grid-cols-2">
              <SkeletonLine className={cn(marketDetailPanelClass, "h-[180px] w-full")} shimmer />
              <SkeletonLine className={cn(marketDetailPanelClass, "h-[180px] w-full")} shimmer />
            </div>
          </div>
          <SkeletonLine
            className={cn(marketDetailPanelClass, "hidden h-[320px] w-full lg:block")}
            shimmer
          />
        </div>
      </div>
    </div>
  );
}
