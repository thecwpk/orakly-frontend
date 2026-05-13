"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { DURATION, EASE_OUT } from "../tokens";

export type ModalTransitionVariant = "center" | "sheet" | "side";

export type ModalTransitionProps = Omit<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "exit"
> & {
  children: ReactNode;
  variant?: ModalTransitionVariant;
};

const VARIANTS: Record<
  ModalTransitionVariant,
  {
    initial: HTMLMotionProps<"div">["initial"];
    animate: HTMLMotionProps<"div">["animate"];
    exit: HTMLMotionProps<"div">["exit"];
  }
> = {
  center: {
    initial: { opacity: 0, y: 12, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.985 },
  },
  sheet: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 24 },
  },
  side: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24 },
  },
};

/**
 * Drop-in modal/sheet entrance — encapsulates the canonical
 * `initial/animate/exit` vectors used in `TradeModal`, `TransferDialog`,
 * `CreateMarketDialog`, etc. so each dialog doesn't repeat the same
 * inline objects.
 *
 *   <DialogPrimitive.Content asChild>
 *     <ModalTransition variant="sheet">{...}</ModalTransition>
 *   </DialogPrimitive.Content>
 */
export function ModalTransition({
  children,
  variant = "center",
  transition,
  ...rest
}: ModalTransitionProps) {
  const v = VARIANTS[variant];
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={transition ?? { duration: DURATION.base, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export type BackdropTransitionProps = Omit<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "exit"
> & {
  children?: ReactNode;
};

/** Companion backdrop fade — stable across dialog families. */
export function BackdropTransition({
  children,
  transition,
  ...rest
}: BackdropTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition ?? { duration: DURATION.fast, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
