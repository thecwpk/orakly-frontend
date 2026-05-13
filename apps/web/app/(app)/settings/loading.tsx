export default function SettingsLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-8 space-y-2">
        <div className="skeleton-shimmer h-3 w-24 rounded-full bg-white/[0.04]" />
        <div className="skeleton-shimmer h-8 w-48 rounded-md bg-white/[0.04]" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer h-[72px] rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]"
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
    </main>
  );
}
