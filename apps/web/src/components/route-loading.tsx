import { ShimmerBox, SkeletonAccentRail } from "@/shared/ui/skeleton-primitives";

type RouteLoadingVariant = "spinner" | "skeleton";

/**
 * Lightweight fallback for route segments — keeps bundle small vs importing
 * full page widgets. Use **`variant="skeleton"`** on premium surfaces (portfolio,
 * markets) when you want parity with real layouts.
 */
export function RouteLoadingSpinner({
  label = "Loading",
  variant = "spinner",
}: {
  label?: string;
  variant?: RouteLoadingVariant;
}) {
  if (variant === "skeleton") {
    return (
      <div
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6"
        aria-busy="true"
        aria-label={label}
      >
        <SkeletonAccentRail className="mb-6" />
        <div className="flex flex-wrap gap-2">
          <ShimmerBox className="h-3 w-40 rounded-full" delayMs={0} />
          <ShimmerBox className="h-3 w-52 rounded-full" delayMs={40} />
        </div>
        <ShimmerBox className="mt-5 h-10 max-w-2xl rounded-lg" delayMs={60} tone="panel" />
        <ShimmerBox className="mt-3 h-10 max-w-xl rounded-lg" delayMs={80} tone="muted" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerBox
              key={i}
              className="min-h-[148px] rounded-xl ring-1 ring-white/[0.06]"
              delayMs={i * 55}
              tone="panel"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[45vh] flex-col items-center justify-center gap-4 bg-[#050508]"
      aria-busy="true"
    >
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-cyan-400/15 blur-xl" />
        <div
          className="relative h-11 w-11 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400 shadow-[0_0_24px_-4px_rgba(34,211,238,0.45)]"
          role="status"
          aria-label={label}
        />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
        Loading
      </p>
    </div>
  );
}
