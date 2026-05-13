import { TrendingMarketGridSkeleton } from "@/widgets/trending-prediction-markets/components/trending-market-card-skeleton";

export default function MarketsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 md:pt-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-3 w-28 rounded" />
          <div className="skeleton-shimmer h-7 w-72 rounded" />
          <div className="skeleton-shimmer h-3 w-96 rounded" />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="skeleton-shimmer h-9 w-9 rounded-lg" />
          <div className="skeleton-shimmer h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* toolbar skeleton */}
      <div className="mb-3 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
        <div className="skeleton-shimmer h-9 flex-1 rounded-lg" />
        <div className="skeleton-shimmer h-9 w-32 rounded-lg" />
        <div className="skeleton-shimmer h-9 w-36 rounded-lg" />
        <div className="skeleton-shimmer h-9 w-20 rounded-lg" />
      </div>

      {/* category rail skeleton */}
      <div className="mb-5 flex items-center gap-1.5 overflow-hidden rounded-xl bg-black/20 p-1.5 ring-1 ring-white/[0.06]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer h-7 rounded-lg"
            style={{ width: `${64 + (i % 4) * 12}px` }}
          />
        ))}
      </div>

      <TrendingMarketGridSkeleton count={9} />
    </main>
  );
}
