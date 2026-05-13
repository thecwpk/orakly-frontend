"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ShimmerVariant = "default" | "neon" | "subtle";

export type ShimmerProps = HTMLAttributes<HTMLSpanElement> & {
  /** Base visual weight. */
  variant?: ShimmerVariant;
  /** Stagger delay (ms) for sibling shimmers. */
  delayMs?: number;
};

/**
 * Inline shimmer block — for pure-CSS loading hints (compositor-only).
 * Pair with `<ShimmerBox>` (already shipped in `@/shared/ui`) for layout
 * placeholders; this variant adds a *neon* tint useful for text loaders
 * inside premium hero sections.
 */
export function Shimmer({
  variant = "default",
  delayMs,
  className,
  style,
  ...rest
}: ShimmerProps) {
  const baseTone =
    variant === "neon"
      ? "bg-cyan-500/[0.10]"
      : variant === "subtle"
        ? "bg-white/[0.04]"
        : "bg-white/[0.06]";

  const cssStyle: CSSProperties =
    delayMs !== undefined
      ? { ...style, animationDelay: `${delayMs}ms` }
      : style ?? {};

  return (
    <span
      aria-hidden
      className={cn(
        "skeleton-shimmer inline-block rounded-md align-middle",
        variant === "neon" &&
          "ring-1 ring-cyan-400/15 shadow-[0_0_20px_-12px_rgba(34,211,238,0.5)]",
        baseTone,
        className,
      )}
      style={cssStyle}
      {...rest}
    />
  );
}
