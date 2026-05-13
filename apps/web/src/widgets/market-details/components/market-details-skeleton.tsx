"use client";

import { SkeletonLine } from "@/widgets/landing/components/landing-skeletons";

export function MarketDetailsSkeleton() {
  return (
    <div className="min-h-screen px-3 py-4 text-zinc-100 sm:px-4 lg:py-5">
      <div className="mx-auto max-w-[min(1600px,100%)]">
        <div className="flex flex-wrap items-center gap-2 pb-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine
              key={i}
              className={`h-8 rounded-md ${i === 0 ? "w-24" : "w-[5.5rem]"}`}
              shimmer
            />
          ))}
          <div className="ml-auto flex gap-1.5">
            <SkeletonLine className="h-8 w-20 rounded-md" shimmer />
            <SkeletonLine className="h-8 w-8 rounded-md" shimmer />
            <SkeletonLine className="h-8 w-8 rounded-md" shimmer />
          </div>
        </div>

        <SkeletonLine className="h-8 w-[88%] max-w-3xl rounded-md" shimmer />

        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-4">
          <div className="space-y-3 lg:min-w-0">
            <SkeletonLine className="h-[384px] w-full rounded-lg" shimmer />
            <SkeletonLine className="h-11 w-full rounded-lg" shimmer />
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
              <SkeletonLine className="h-[260px] rounded-lg" shimmer />
              <SkeletonLine className="h-[260px] rounded-lg" shimmer />
            </div>
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
              <SkeletonLine className="h-[280px] rounded-lg" shimmer />
              <SkeletonLine className="h-[280px] rounded-lg" shimmer />
            </div>
            <SkeletonLine className="h-[140px] rounded-lg" shimmer />
            <div className="grid gap-2 lg:grid-cols-2">
              <SkeletonLine className="h-[220px] rounded-lg" shimmer />
              <SkeletonLine className="h-[220px] rounded-lg" shimmer />
            </div>
          </div>

          <div className="mt-4 lg:mt-0">
            <SkeletonLine className="h-[560px] rounded-lg lg:sticky lg:top-[calc(var(--app-topbar-h)+8px)]" shimmer />
          </div>
        </div>
      </div>
    </div>
  );
}
