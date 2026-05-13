export function AdminDashboardSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 px-3 py-4 sm:px-4 lg:gap-6 lg:px-8 lg:py-8">
      <aside className="skeleton-shimmer hidden h-[calc(100vh-4rem)] w-60 shrink-0 rounded-2xl ring-1 ring-white/[0.04] lg:block" />
      <main className="min-w-0 flex-1 space-y-4">
        <div className="skeleton-shimmer h-16 rounded-2xl ring-1 ring-white/[0.04]" />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer h-[100px] rounded-2xl ring-1 ring-white/[0.04]"
            />
          ))}
        </div>
        <div className="skeleton-shimmer h-[260px] rounded-2xl ring-1 ring-white/[0.04]" />
      </main>
    </div>
  );
}
