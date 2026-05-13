import { TrendingMarketGridSkeleton } from "@/widgets/trending-prediction-markets/components/trending-market-card-skeleton";

export default function TrendingLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 md:pt-8">
      <div className="mb-6 space-y-2">
        <div className="skeleton-shimmer h-3 w-28 rounded bg-white/[0.04]" />
        <div className="skeleton-shimmer h-8 w-56 rounded-md bg-white/[0.04]" />
      </div>
      <TrendingMarketGridSkeleton count={12} />
    </main>
  );
}
