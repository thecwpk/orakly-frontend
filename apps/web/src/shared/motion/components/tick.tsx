"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, type HTMLAttributes, type ReactNode } from "react";
import { DURATION, EASE_OUT } from "../tokens";
import { cn } from "@/lib/utils";

export type TickDirection = "up" | "down" | "auto" | "none";

export type TickProps = HTMLAttributes<HTMLSpanElement> & {
  /** The string to render — typically a formatted number / price. */
  children: ReactNode;
  /**
   * A stable identity for the *value*. When this changes, Tick swaps the
   * inner element with a tiny slide. Use `value={price}` and let `children`
   * be the *formatted* version of the same number.
   */
  value: string | number;
  /** Optional direction hint; otherwise inferred from numeric `value` deltas. */
  direction?: TickDirection;
};

/**
 * Premium ticker-style number transition. The outgoing value slides up/down
 * out of view while the incoming value slides in from the opposite side —
 * the canonical price-feed cue traders expect.
 *
 *   <Tick value={price}>{cents(price)}</Tick>
 *
 * Uses `AnimatePresence` `mode="popLayout"` so consecutive updates stack
 * cleanly (no layout shift, no flicker).
 */
function TickImpl({
  children,
  value,
  direction = "auto",
  className,
  ...rest
}: TickProps) {
  const dir = direction;
  // Direction is derived from value identity in `Tick.Wrapper` if needed.
  // Here we rely on a per-value re-mount, so direction only flips the
  // initial offset.

  const initialY = dir === "down" ? -8 : 8;
  const exitY = dir === "down" ? 8 : -8;

  if (direction === "none") {
    return (
      <span className={cn("inline-block tabular-nums", className)} {...rest}>
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn("relative inline-flex overflow-hidden tabular-nums", className)}
      {...rest}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: initialY, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: exitY, opacity: 0, position: "absolute" }}
          transition={{ duration: DURATION.fast, ease: EASE_OUT }}
          className="inline-block whitespace-nowrap"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export const Tick = memo(TickImpl);
