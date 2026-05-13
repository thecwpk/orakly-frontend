export default function ActivityLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-6 sm:px-6 md:pt-8">
      <div className="space-y-2">
        <div className="skeleton-shimmer h-3 w-32 rounded" />
        <div className="skeleton-shimmer h-7 w-72 rounded" />
        <div className="skeleton-shimmer h-3 w-96 rounded" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-24 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-14 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
