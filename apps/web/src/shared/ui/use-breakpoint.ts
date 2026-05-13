"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe breakpoint hooks driven by `matchMedia`.
 *
 * Uses `useSyncExternalStore` so renders are tear-free and the server snapshot
 * is deterministic (defaults to "desktop" on SSR — most app surfaces start in a
 * desktop layout, then re-render once the client subscribes to the listener).
 *
 * Use these hooks sparingly — prefer Tailwind responsive classes for layout.
 * Reach for these only when *behavior* depends on viewport (drag thresholds,
 * gesture vs. click, lazy chart sizing).
 */

const BREAKPOINTS = {
  sm: "(min-width: 40rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
  xl: "(min-width: 80rem)",
  "2xl": "(min-width: 96rem)",
  "3xl": "(min-width: 120rem)",
  "4xl": "(min-width: 160rem)",
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

function subscribe(query: string, cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(query);
  const handler = () => cb();
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}

function getMatch(query: string): boolean {
  if (typeof window === "undefined") return true; // SSR: assume desktop
  return window.matchMedia(query).matches;
}

/**
 * Returns true once the viewport is at least the given breakpoint.
 * `useMediaUp("lg")` mirrors Tailwind's `lg:` prefix semantics.
 */
export function useMediaUp(bp: Breakpoint): boolean {
  const query = BREAKPOINTS[bp];
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => getMatch(query),
    () => true,
  );
}

/** True only when the viewport is *below* a breakpoint. Convenience inverse. */
export function useMediaDown(bp: Breakpoint): boolean {
  return !useMediaUp(bp);
}

/**
 * Returns the largest breakpoint key whose min-width matches. Useful for
 * conditional component swaps. Returns `null` only on the very first SSR pass.
 */
export function useBreakpoint(): Breakpoint | "base" {
  const sm = useMediaUp("sm");
  const md = useMediaUp("md");
  const lg = useMediaUp("lg");
  const xl = useMediaUp("xl");
  const x2 = useMediaUp("2xl");
  const x3 = useMediaUp("3xl");
  const x4 = useMediaUp("4xl");
  if (x4) return "4xl";
  if (x3) return "3xl";
  if (x2) return "2xl";
  if (xl) return "xl";
  if (lg) return "lg";
  if (md) return "md";
  if (sm) return "sm";
  return "base";
}

/**
 * Coarse-pointer / hover detection. True on touch devices that have *no*
 * hover support — drives gesture-first interactions like swipe-to-close,
 * pull-to-refresh, larger tap targets, and disabled hover-only affordances.
 */
export function useIsTouch(): boolean {
  return useSyncExternalStore(
    (cb) => subscribe("(pointer: coarse)", cb),
    () => getMatch("(pointer: coarse)"),
    () => false,
  );
}
