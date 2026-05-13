"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { DURATION, EASE_OUT } from "./tokens";

/**
 * Mounts a single `MotionConfig` provider so every `motion.*` element in the
 * app picks up consistent defaults *without* repeating the same `transition`
 * prop everywhere.
 *
 * Settings:
 *   - `reducedMotion="user"` — Framer Motion automatically disables animations
 *     for users with `prefers-reduced-motion: reduce`. No more bespoke
 *     `useHydrationSafeReducedMotion()` checks for default cases.
 *   - `transition` — sets the global default to our shared **fast** preset,
 *     keeping the trading UI snappy. Per-component overrides still win.
 *
 * Mount near the top of the tree (inside `AppProviders`).
 */
export function AppMotionConfig({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: DURATION.fast, ease: EASE_OUT }}
    >
      {children}
    </MotionConfig>
  );
}
