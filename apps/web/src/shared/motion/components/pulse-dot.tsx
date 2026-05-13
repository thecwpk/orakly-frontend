"use client";

import { motion } from "framer-motion";
import { memo, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { DURATION, EASE_IN_OUT } from "../tokens";

export type PulseDotAccent = "cyan" | "emerald" | "rose" | "violet" | "amber";

const COLOR: Record<PulseDotAccent, { dot: string; ring: string }> = {
  cyan: { dot: "bg-cyan-400", ring: "bg-cyan-400/45" },
  emerald: { dot: "bg-emerald-400", ring: "bg-emerald-400/45" },
  rose: { dot: "bg-rose-400", ring: "bg-rose-400/45" },
  violet: { dot: "bg-violet-400", ring: "bg-violet-400/45" },
  amber: { dot: "bg-amber-400", ring: "bg-amber-400/45" },
};

export type PulseDotProps = HTMLAttributes<HTMLSpanElement> & {
  accent?: PulseDotAccent;
  /** Diameter in px. */
  size?: number;
  /** Disable the heartbeat (stays solid). */
  disabled?: boolean;
};

/**
 * Heartbeat status dot — solid core + expanding fading halo. Two animated
 * properties only (`opacity`, `transform: scale`) so the GPU compositor
 * handles everything; safe to mount dozens at a time on a trading list.
 */
function PulseDotImpl({
  accent = "cyan",
  size = 8,
  disabled = false,
  className,
  style,
  ...rest
}: PulseDotProps) {
  const c = COLOR[accent];
  const dim = `${size}px`;
  return (
    <span
      role="status"
      aria-label="Live"
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: dim, height: dim, ...style }}
      {...rest}
    >
      <span
        className={cn("absolute inset-0 rounded-full", c.dot)}
        aria-hidden
      />
      {!disabled ? (
        <motion.span
          aria-hidden
          className={cn("absolute inset-0 rounded-full", c.ring)}
          initial={{ scale: 1, opacity: 0.65 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{
            duration: DURATION.slow * 4,
            ease: EASE_IN_OUT,
            repeat: Infinity,
            repeatType: "loop",
          }}
        />
      ) : null}
    </span>
  );
}

export const PulseDot = memo(PulseDotImpl);
