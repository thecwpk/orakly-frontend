"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { DURATION, EASE_OUT } from "../tokens";

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

export type RevealProps = Omit<HTMLMotionProps<"div">, "initial" | "animate"> & {
  children: ReactNode;
  /** Slide direction on entry. `"none"` = pure fade. */
  direction?: RevealDirection;
  /** Distance (px) for the entry slide; defaults to 14. */
  distance?: number;
  duration?: number;
  delay?: number;
  /** Animate when scrolled into view rather than on mount. */
  whenInView?: boolean;
  /** Re-trigger on every viewport entry (default: only the first time). */
  repeat?: boolean;
};

function offset(direction: RevealDirection, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    case "none":
    default:
      return {};
  }
}

/**
 * Directional fade reveal. Pair with `whenInView` for hero / section reveals
 * scrolled into view. Single component covers most marketing-page entry
 * animations without extra Framer Motion boilerplate.
 */
export function Reveal({
  children,
  direction = "up",
  distance = 14,
  duration = DURATION.base,
  delay = 0,
  whenInView = false,
  repeat = false,
  transition,
  ...rest
}: RevealProps) {
  const o = offset(direction, distance);

  const baseTransition = {
    duration,
    ease: EASE_OUT,
    delay,
    ...(transition ?? {}),
  };

  if (whenInView) {
    return (
      <motion.div
        initial={{ opacity: 0, ...o }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: !repeat, margin: "0px 0px -8% 0px" }}
        transition={baseTransition}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...o }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={baseTransition}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
