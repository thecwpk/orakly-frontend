export function AdminDashboardSkeleton() {
  return (
    <div className="hub-container flex max-w-[1600px] gap-6 px-3 py-6 sm:px-4 lg:px-6">
      <aside className="skeleton-shimmer hidden h-[calc(100vh-8rem)] w-60 shrink-0 rounded-2xl ring-1 ring-[var(--hub-border)] lg:block" />
      <div className="min-w-0 flex-1 space-y-4">
        <div className="skeleton-shimmer h-16 rounded-2xl ring-1 ring-[var(--hub-border)]" />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer h-[100px] rounded-2xl ring-1 ring-[var(--hub-border)]"
            />
          ))}
        </div>
        <div className="skeleton-shimmer h-[260px] rounded-2xl ring-1 ring-[var(--hub-border)]" />
      </div>
    </div>
  );
}
