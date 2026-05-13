/**
 * Motion design tokens — single source of truth for durations, easings, and
 * springs across the app. Keeps timings consistent (no one-off `0.27s`
 * transitions sprinkled across files) and makes the whole system tunable from
 * one place.
 *
 * Performance discipline:
 *   - Animations should only touch `transform` / `opacity` (compositor-only).
 *   - Avoid animating `width` / `height` / `top` / `left` — those trigger
 *     layout/paint and burn frames during scroll and trade-tape updates.
 *   - When several elements need to enter together, rely on staggered fade +
 *     translate variants from `./variants` so React Query refetches don't
 *     cascade into per-card React-controlled spring chains.
 */

import type { Transition } from "framer-motion";

/* ---------------------------------------------------------------- */
/* Durations (seconds)                                               */
/* ---------------------------------------------------------------- */

export const DURATION = {
  /** Micro-interactions: pressed states, tooltips. */
  instant: 0.12,
  /** Default transitions: hover, button hover, panel toggles. */
  fast: 0.18,
  /** Standard panel reveals, list rows, popovers. */
  base: 0.24,
  /** Hero / large-surface transitions; rare. */
  slow: 0.36,
  /** Page-template route fades. */
  page: 0.22,
} as const;

/* ---------------------------------------------------------------- */
/* Easings                                                           */
/* ---------------------------------------------------------------- */

/**
 * `easeOut` style cubic-bezier — the dominant feel of the app.
 * Matches the existing `[0.22, 1, 0.36, 1]` baked into many widgets.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Snappier for press / hover. */
export const EASE_OUT_FAST = [0.32, 0.72, 0, 1] as const;

/** Gentle in-and-out for hero / aurora-style fades. */
export const EASE_IN_OUT = [0.5, 0, 0.2, 1] as const;

/** Subtle anticipation/overshoot for headline reveals. */
export const EASE_BACK = [0.34, 1.4, 0.64, 1] as const;

/* ---------------------------------------------------------------- */
/* Springs                                                           */
/* ---------------------------------------------------------------- */

/**
 * Premium spring bank — chosen for fintech "settled" feel, *no* visible
 * bounce on common UI elements. Use `bouncy` only for celebrations.
 */
export const SPRING = {
  soft: { type: "spring", stiffness: 220, damping: 28, mass: 0.9 },
  snappy: { type: "spring", stiffness: 360, damping: 32, mass: 0.7 },
  rigid: { type: "spring", stiffness: 480, damping: 38, mass: 0.6 },
  bouncy: { type: "spring", stiffness: 380, damping: 18, mass: 1 },
} as const satisfies Record<string, Transition>;

/* ---------------------------------------------------------------- */
/* Stagger constants                                                 */
/* ---------------------------------------------------------------- */

export const STAGGER = {
  /** Tight cascade for dense KPI rows. */
  tight: 0.035,
  /** Default for card grids. */
  base: 0.05,
  /** Generous for hero-section reveals. */
  loose: 0.08,
} as const;

/* ---------------------------------------------------------------- */
/* Helpers                                                           */
/* ---------------------------------------------------------------- */

/** Build a transition that respects `prefers-reduced-motion`. */
export function reducedMotionAware(
  reduced: boolean,
  transition: Transition,
): Transition {
  if (!reduced) return transition;
  return { duration: 0 };
}
