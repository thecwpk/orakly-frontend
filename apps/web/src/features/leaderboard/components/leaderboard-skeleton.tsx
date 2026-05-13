export function LeaderboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer h-[90px] rounded-xl ring-1 ring-white/[0.04]"
          />
        ))}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer h-[200px] rounded-2xl ring-1 ring-white/[0.04]"
          />
        ))}
      </div>
      <div className="skeleton-shimmer h-[420px] rounded-2xl ring-1 ring-white/[0.04]" />
    </div>
  );
}
