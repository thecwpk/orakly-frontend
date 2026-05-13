import { TrendingMarketGridSkeleton } from "@/widgets/trending-prediction-markets/components/trending-market-card-skeleton";

/** Discover uses grid + sticky wire rail — mirrors route chrome without fetching. */
export default function DiscoverLoading() {
  return (
    <main className="marketing-discover mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer h-8 w-[88px] rounded-full bg-white/[0.04]"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
        <div className="skeleton-shimmer h-9 w-24 rounded-full bg-white/[0.04]" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer h-8 rounded-md bg-white/[0.04]"
              style={{ width: `${56 + (i % 4) * 18}px`, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        <div className="skeleton-shimmer h-9 w-full rounded-lg bg-white/[0.04] sm:max-w-xs" />
      </div>

      <div className="mb-6 skeleton-shimmer h-3 w-64 rounded-full bg-white/[0.03]" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <TrendingMarketGridSkeleton count={9} />
        <aside className="hidden lg:block">
          <div className="skeleton-shimmer min-h-[280px] rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]" />
        </aside>
      </div>
    </main>
  );
}
