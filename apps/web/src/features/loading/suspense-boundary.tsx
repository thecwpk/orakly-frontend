"use client";

import {
  Suspense,
  type ReactNode,
  type SuspenseProps,
} from "react";

export type PageSuspenseProps = Omit<SuspenseProps, "fallback"> & {
  children: ReactNode;
  /** Rendered while lazy children resolve — defaults to a minimal shimmer strip. */
  fallback?: ReactNode;
};

/**
 * Opinionated `Suspense` wrapper for route-level lazy islands. Prefer passing
 * a domain-specific skeleton from `@/features/markets` / `@/widgets/*` as
 * `fallback` for visual continuity.
 */
export function PageSuspense({
  children,
  fallback,
  ...rest
}: PageSuspenseProps) {
  return (
    <Suspense fallback={fallback ?? <SuspenseFallbackMinimal />} {...rest}>
      {children}
    </Suspense>
  );
}

/** Tiny fallback when no bespoke skeleton is supplied — avoids blank flashes. */
export function SuspenseFallbackMinimal() {
  return (
    <div
      className="flex min-h-[120px] flex-col justify-center gap-3 px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="skeleton-shimmer h-3 w-40 rounded-full bg-white/[0.05]" />
      <div className="skeleton-shimmer h-9 w-full max-w-xl rounded-lg bg-white/[0.04]" />
      <div className="skeleton-shimmer h-9 w-4/5 max-w-lg rounded-lg bg-white/[0.03]" />
    </div>
  );
}
