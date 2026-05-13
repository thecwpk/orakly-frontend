"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { staggerParent, staggerItem } from "../variants";
import { STAGGER } from "../tokens";

export type StaggerProps = Omit<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "variants"
> & {
  children: ReactNode;
  /** Per-child delay step (seconds). */
  stagger?: number;
  /** Initial delay before the first child enters. */
  delayChildren?: number;
  /** Trigger when scrolled into view rather than on mount. */
  whenInView?: boolean;
};

/**
 * Parent that orchestrates staggered child reveals. Use with `<StaggerItem>`:
 *
 *   <Stagger>
 *     {items.map(i => <StaggerItem key={i.id}>...</StaggerItem>)}
 *   </Stagger>
 *
 * Single re-render to start; child timings are driven entirely by Framer
 * Motion's variant orchestration — cheaper than per-child `delay` props
 * because each child's transition is computed once at mount.
 */
export function Stagger({
  children,
  stagger = STAGGER.base,
  delayChildren = 0.04,
  whenInView = false,
  ...rest
}: StaggerProps) {
  const variants = staggerParent({ stagger, delayChildren });

  if (whenInView) {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        variants={variants}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export type StaggerItemProps = Omit<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "variants"
> & {
  children: ReactNode;
};

/** Default staggered child — fade-up. Pass any element-level props. */
export function StaggerItem({ children, ...rest }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItem} {...rest}>
      {children}
    </motion.div>
  );
}
