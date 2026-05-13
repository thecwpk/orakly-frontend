/** Soft-nav skeleton for hub segment transitions (shell chrome stays mounted). */
export default function HubLoading() {
  return (
    <div className="mx-auto w-full max-w-[min(1420px,calc(100vw-32px))] animate-pulse space-y-4 px-4 py-12 sm:px-6 lg:px-10 xl:px-12">
      <div className="h-10 w-2/3 max-w-lg rounded-lg bg-white/[0.06]" />
      <div className="h-4 w-full max-w-xl rounded bg-white/[0.04]" />
      <div className="h-[min(52vh,420px)] rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}
