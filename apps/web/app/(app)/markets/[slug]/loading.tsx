export default function MarketDetailsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer h-7 w-24 rounded-full" />
          <div className="skeleton-shimmer h-7 w-20 rounded-full" />
          <div className="skeleton-shimmer h-7 w-16 rounded-full" />
        </div>
        <div className="skeleton-shimmer h-9 w-3/4 max-w-xl rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="skeleton-shimmer h-24 rounded-2xl" />
          <div className="skeleton-shimmer h-24 rounded-2xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="skeleton-shimmer h-72 rounded-2xl" />
            <div className="skeleton-shimmer h-32 rounded-2xl" />
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="skeleton-shimmer h-72 rounded-2xl" />
              <div className="skeleton-shimmer h-72 rounded-2xl" />
            </div>
          </div>
          <div className="skeleton-shimmer h-[420px] rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
