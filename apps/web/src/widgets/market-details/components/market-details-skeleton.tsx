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

        <div className="mt-4 space-y-3 lg:min-w-0">
          <SkeletonLine className="h-[384px] w-full rounded-lg" shimmer />
          <SkeletonLine className="h-11 w-full rounded-lg" shimmer />
          <div className="grid gap-2 lg:grid-cols-3">
            <SkeletonLine className="h-[260px] rounded-lg" shimmer />
            <SkeletonLine className="h-[260px] rounded-lg" shimmer />
            <SkeletonLine
              className="h-[min(420px,52vh)] rounded-lg lg:sticky lg:top-[calc(var(--app-topbar-h)+8px)]"
              shimmer
            />
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            <SkeletonLine className="h-[220px] rounded-lg" shimmer />
            <SkeletonLine className="h-[220px] rounded-lg" shimmer />
          </div>
          <SkeletonLine className="h-[140px] rounded-lg" shimmer />
          <div className="grid gap-2 lg:grid-cols-2">
            <SkeletonLine className="h-[220px] rounded-lg" shimmer />
            <SkeletonLine className="h-[220px] rounded-lg" shimmer />
          </div>
        </div>
      </div>
    </div>
  );
}
