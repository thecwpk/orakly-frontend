export default function WalletLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-6 sm:px-6 md:pt-8">
      <div className="skeleton-shimmer h-7 w-40 rounded" />
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="skeleton-shimmer h-40 rounded-2xl lg:col-span-2" />
        <div className="skeleton-shimmer h-40 rounded-2xl" />
      </div>
      <div className="skeleton-shimmer h-72 rounded-2xl" />
    </main>
  );
}
