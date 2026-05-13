/**
 * Reusable Framer Motion variants — pass to any `motion.*` element via
 * `variants`, `initial`, `animate`, `exit`. The variants only animate
 * `opacity` and `transform`, keeping work on the GPU compositor.
 *
 * ```tsx
 * <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="hidden" />
 * ```
 *
 * For staggered children, use `staggerParent` on the parent and `fadeUp`
 * (or any item variant) on each child.
 */

import type { Variants } from "framer-motion";
import { DURATION, EASE_OUT, EASE_OUT_FAST, STAGGER } from "./tokens";

/* ---------------------------------------------------------------- */
/* Fade reveal                                                       */
/* ---------------------------------------------------------------- */

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.fast, ease: EASE_OUT_FAST },
  },
};

/* ---------------------------------------------------------------- */
/* Stagger                                                           */
/* ---------------------------------------------------------------- */

export type StaggerOptions = {
  /** Delay between sibling children. */
  stagger?: number;
  /** Initial delay before first child. */
  delayChildren?: number;
};

export function staggerParent({
  stagger = STAGGER.base,
  delayChildren = 0.04,
}: StaggerOptions = {}): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
  };
}

/** Default item variant for staggered children — combine with `staggerParent`. */
export const staggerItem: Variants = fadeUp;

/* ---------------------------------------------------------------- */
/* Modal / overlay                                                   */
/* ---------------------------------------------------------------- */

/** Backdrop fade for dialog overlays. */
export const overlayBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
};

/** Centered modal content — slight rise + fade + scale for premium feel. */
export const modalContent: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

/** Bottom-sheet variant for mobile. */
export const sheetContent: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

/* ---------------------------------------------------------------- */
/* Realtime updates                                                  */
/* ---------------------------------------------------------------- */

/** Activity / trade tape row entry — slides in from the top, fades out below. */
export const tapeRow: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: DURATION.instant, ease: EASE_OUT },
  },
};

/** Re-orderable list row (e.g. leaderboard rank shifts). */
export const reorderRow: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.instant },
  },
};
