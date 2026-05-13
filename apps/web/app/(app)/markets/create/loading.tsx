export default function CreateMarketLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer h-7 w-24 rounded-full" />
          <div className="skeleton-shimmer h-7 w-32 rounded-full" />
        </div>
        <div className="skeleton-shimmer h-9 w-2/3 max-w-md rounded-lg" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="glass-panel-strong space-y-5 rounded-2xl p-5">
            <div className="grid grid-cols-5 gap-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-10 rounded-lg" />
              ))}
            </div>
            <div className="space-y-3 border-t border-white/[0.06] pt-5">
              <div className="skeleton-shimmer h-3 w-24 rounded" />
              <div className="skeleton-shimmer h-10 w-full rounded-xl" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="skeleton-shimmer h-10 rounded-xl" />
                <div className="skeleton-shimmer h-10 rounded-xl" />
              </div>
              <div className="skeleton-shimmer h-20 w-full rounded-xl" />
            </div>
          </div>
          <div className="glass-panel-strong space-y-3 rounded-2xl p-4">
            <div className="skeleton-shimmer h-3 w-24 rounded" />
            <div className="skeleton-shimmer h-1 w-full rounded-full" />
            <div className="skeleton-shimmer h-5 w-4/5 rounded" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-10 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
