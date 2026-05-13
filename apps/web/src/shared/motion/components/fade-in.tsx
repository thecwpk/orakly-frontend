"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { DURATION, EASE_OUT } from "../tokens";

export type FadeInProps = Omit<HTMLMotionProps<"div">, "initial" | "animate"> & {
  children: ReactNode;
  /** Stagger position when used inside a list (capped to ~10). */
  index?: number;
  /** Per-step stagger amount in seconds. */
  staggerMs?: number;
  /** Vertical translate offset on entry (defaults to 8px). */
  y?: number;
  /** Override the duration; defaults to `DURATION.base`. */
  duration?: number;
  /** Animate when scrolled into view rather than on mount. */
  whenInView?: boolean;
};

const STAGGER_CAP = 10;

/**
 * Fade-up reveal — the workhorse mount transition for content blocks.
 *
 *   <FadeIn index={i}><Card /></FadeIn>
 *
 * Honors the global `MotionConfig` reduced-motion handling, so consumers
 * don't need to gate the import behind a media query.
 */
export function FadeIn({
  children,
  index = 0,
  staggerMs = 40,
  y = 8,
  duration = DURATION.base,
  whenInView = false,
  transition,
  ...rest
}: FadeInProps) {
  const delay = (Math.min(index, STAGGER_CAP) * staggerMs) / 1000;

  const baseTransition = {
    duration,
    ease: EASE_OUT,
    delay,
    ...(transition ?? {}),
  };

  if (whenInView) {
    return (
      <motion.div
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={baseTransition}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={baseTransition}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
