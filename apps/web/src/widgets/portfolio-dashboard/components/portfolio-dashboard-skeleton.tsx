"use client";

import { cn } from "@/lib/utils";
import { Container } from "@/shared/ui";
import { SkeletonLine } from "@/widgets/landing/components/landing-skeletons";

export function PortfolioDashboardSkeleton({ className }: { className?: string }) {
  return (
    <main className={cn("text-zinc-100", className)}>
      <Container width="2xl" className="pb-s48 pt-s40 lg:pb-s64 lg:pt-s56">
        <div className="flex flex-wrap items-end justify-between gap-r16 border-b border-white/[0.06] pb-r24">
          <div className="space-y-r16">
            <SkeletonLine className="h-5 w-32 rounded-[3px]" shimmer />
            <SkeletonLine className="h-3 w-56 rounded-[3px]" shimmer />
          </div>
          <SkeletonLine className="h-8 w-24 rounded-[3px]" shimmer />
        </div>

        <div className="mt-r24 flex flex-col gap-r24 lg:gap-r24">
          <div className="flex flex-col gap-r24 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-r24">
            <div className="flex flex-col gap-r24">
              <SkeletonLine className="h-[118px] w-full rounded-md" shimmer />
              <SkeletonLine className="min-h-[260px] w-full flex-1 rounded-md" shimmer />
            </div>
            <div className="flex flex-col gap-r16">
              <SkeletonLine className="h-[200px] w-full rounded-md" shimmer />
              <div className="grid grid-cols-2 gap-r16 lg:grid-cols-1">
                <SkeletonLine className="h-[112px] rounded-md" shimmer />
                <SkeletonLine className="h-[112px] rounded-md" shimmer />
              </div>
            </div>
          </div>

          <div className="mt-s48 border-t border-white/[0.06] pt-r24">
            <SkeletonLine className="mb-r16 h-2 w-28 rounded-[3px]" shimmer />
            <SkeletonLine className="h-[220px] w-full rounded-md" shimmer />
          </div>
        </div>
      </Container>
    </main>
  );
}
