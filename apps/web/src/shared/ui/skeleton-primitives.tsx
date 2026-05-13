"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SkeletonTone = "default" | "muted" | "panel";

const TONE_BG: Record<SkeletonTone, string> = {
  default: "bg-white/[0.06]",
  muted: "bg-white/[0.04]",
  panel: "bg-white/[0.03]",
};

export type ShimmerBoxProps = HTMLAttributes<HTMLDivElement> & {
  /** Stagger wave across sibling skeletons (ms). */
  delayMs?: number;
  tone?: SkeletonTone;
  /** When false, skip shimmer animation (pair with reduced-motion elsewhere). */
  shimmer?: boolean;
};

/**
 * Base building block — applies `.skeleton-shimmer` from `globals.css` plus a
 * subtle glass tint. All premium skeletons should compose from this.
 */
export function ShimmerBox({
  className,
  delayMs,
  tone = "muted",
  shimmer = true,
  style,
  ...rest
}: ShimmerBoxProps) {
  return (
    <div
      className={cn(
        shimmer && "skeleton-shimmer",
        TONE_BG[tone],
        className,
      )}
      style={
        delayMs !== undefined ?
          { ...style, animationDelay: `${delayMs}ms` } satisfies CSSProperties
        : style
      }
      {...rest}
    />
  );
}

export function SkeletonTextLines({
  lines = 3,
  className,
  widths = ["90%", "72%", "48%"],
}: {
  lines?: number;
  className?: string;
  widths?: string[];
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerBox
          key={i}
          delayMs={i * 70}
          className="h-3 rounded-md"
          style={{ width: widths[i] ?? "60%" }}
        />
      ))}
    </div>
  );
}

/** Thin neon accent bar — use above card grids for brand continuity. */
export function SkeletonAccentRail({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent opacity-80",
        className,
      )}
    />
  );
}
