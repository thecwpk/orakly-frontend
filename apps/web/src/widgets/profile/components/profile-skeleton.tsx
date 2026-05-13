export function ProfileSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="skeleton-shimmer h-[180px] rounded-2xl ring-1 ring-white/[0.04] sm:h-[200px]" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer h-[80px] rounded-xl ring-1 ring-white/[0.04]"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="skeleton-shimmer h-[300px] rounded-2xl ring-1 ring-white/[0.04]" />
        <div className="skeleton-shimmer h-[300px] rounded-2xl ring-1 ring-white/[0.04]" />
      </div>
      <div className="skeleton-shimmer h-[200px] rounded-2xl ring-1 ring-white/[0.04]" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="skeleton-shimmer h-[420px] rounded-2xl ring-1 ring-white/[0.04]" />
        <div className="skeleton-shimmer h-[420px] rounded-2xl ring-1 ring-white/[0.04]" />
      </div>
    </div>
  );
}
