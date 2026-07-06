export function LeaderboardRowsSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-white/[0.06]">
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-6 w-8 animate-pulse rounded bg-zinc-800" />
            <div className="h-8 w-8 animate-pulse rounded-md bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-zinc-800" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-zinc-800" />
            </div>
            <div className="hidden h-3 w-16 animate-pulse rounded bg-zinc-800 sm:block" />
            <div className="hidden h-3 w-16 animate-pulse rounded bg-zinc-800 md:block" />
            <div className="hidden h-3 w-16 animate-pulse rounded bg-zinc-800 lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
