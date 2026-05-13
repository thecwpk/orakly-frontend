import { LeaderboardSkeleton } from "@/features/leaderboard";

export default function LeaderboardLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 pb-16 pt-6 sm:px-6 md:space-y-6 md:pt-8">
      <div className="space-y-3 border-b border-white/[0.06] pb-5">
        <div className="skeleton-shimmer h-3 w-32 rounded" />
        <div className="skeleton-shimmer h-7 w-72 rounded" />
        <div className="skeleton-shimmer h-3 w-96 max-w-full rounded" />
        <div className="flex gap-2 pt-2">
          <div className="skeleton-shimmer h-9 w-64 rounded-lg" />
          <div className="skeleton-shimmer h-9 w-44 rounded-lg" />
        </div>
      </div>
      <LeaderboardSkeleton />
    </main>
  );
}
