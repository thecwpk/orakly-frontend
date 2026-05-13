"use client";

import { motion } from "framer-motion";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { memo } from "react";
import { cn } from "@/lib/utils";

/**
 * KPI tile primitive used by every dashboard surface (portfolio, leaderboard,
 * admin, profile). One canonical visual — change the design here, every
 * page benefits.
 *
 * Visual contract:
 *   - top row: eyebrow label + accent icon (icon size: 16px)
 *   - main:    large mono-numeric value (auto `tabular-nums`)
 *   - footer:  optional secondary value or delta chip
 *   - on hover: subtle inset glow (no layout reflow)
 */
type Tone = "neutral" | "accent" | "success" | "danger" | "violet" | "amber";

const ACCENT_RING: Record<Tone, string> = {
  neutral: "ring-white/[0.08]",
  accent: "ring-cyan-400/25",
  success: "ring-emerald-400/25",
  danger: "ring-rose-400/25",
  violet: "ring-violet-400/25",
  amber: "ring-amber-400/25",
};
const ACCENT_BG: Record<Tone, string> = {
  neutral: "bg-[#0c0c14]/85",
  accent: "bg-[#0c0c14]/85 [background-image:radial-gradient(120%_120%_at_0%_0%,rgba(34,211,238,0.07),transparent_55%)]",
  success: "bg-[#0c0c14]/85 [background-image:radial-gradient(120%_120%_at_0%_0%,rgba(110,231,183,0.07),transparent_55%)]",
  danger: "bg-[#0c0c14]/85 [background-image:radial-gradient(120%_120%_at_0%_0%,rgba(251,113,133,0.07),transparent_55%)]",
  violet: "bg-[#0c0c14]/85 [background-image:radial-gradient(120%_120%_at_0%_0%,rgba(167,139,250,0.07),transparent_55%)]",
  amber: "bg-[#0c0c14]/85 [background-image:radial-gradient(120%_120%_at_0%_0%,rgba(252,211,77,0.07),transparent_55%)]",
};
const ACCENT_ICON: Record<Tone, string> = {
  neutral: "text-zinc-400",
  accent: "text-cyan-300",
  success: "text-emerald-300",
  danger: "text-rose-300",
  violet: "text-violet-300",
  amber: "text-amber-300",
};
const ACCENT_VALUE: Record<Tone, string> = {
  neutral: "text-zinc-50",
  accent: "text-zinc-50",
  success: "text-emerald-200",
  danger: "text-rose-200",
  violet: "text-zinc-50",
  amber: "text-zinc-50",
};

type IconProp = ComponentType<SVGProps<SVGSVGElement>>;

export type MetricTileProps = {
  label: ReactNode;
  value: ReactNode;
  /** Tiny secondary line under the value (e.g. "Cash"). */
  hint?: ReactNode;
  /** Optional delta chip to the right (e.g. "+3.2%"). */
  delta?: ReactNode;
  deltaTone?: "success" | "danger" | "neutral";
  icon?: IconProp;
  tone?: Tone;
  /** Optional render slot — sparkline / mini chart at the bottom. */
  trail?: ReactNode;
  /** Animation index for staggered mount. */
  index?: number;
  className?: string;
};

function MetricTileInner({
  label,
  value,
  hint,
  delta,
  deltaTone = "neutral",
  icon: Icon,
  tone = "neutral",
  trail,
  index = 0,
  className,
}: MetricTileProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index, 8) * 0.035, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group/metric relative overflow-hidden rounded-xl px-3 py-2.5 ring-1 backdrop-blur-sm",
        "transition-shadow duration-200",
        "hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
        ACCENT_BG[tone],
        ACCENT_RING[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            {label}
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-lg font-semibold leading-none tracking-tight tabular-nums sm:text-xl",
              ACCENT_VALUE[tone],
            )}
          >
            {value}
          </p>
          {hint ? (
            <p className="mt-1 font-mono text-[9.5px] text-zinc-600">{hint}</p>
          ) : null}
        </div>

        {Icon ? (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 opacity-60 transition-opacity group-hover/metric:opacity-90",
              ACCENT_ICON[tone],
            )}
            aria-hidden
          />
        ) : null}
      </div>

      {delta ? (
        <span
          className={cn(
            "absolute right-2.5 top-2.5 inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ring-1",
            deltaTone === "success"
              ? "bg-emerald-500/12 text-emerald-200 ring-emerald-400/25"
              : deltaTone === "danger"
                ? "bg-rose-500/12 text-rose-200 ring-rose-400/25"
                : "bg-white/[0.04] text-zinc-300 ring-white/10",
          )}
        >
          {delta}
        </span>
      ) : null}

      {trail ? <div className="mt-2.5">{trail}</div> : null}
    </motion.article>
  );
}

export const MetricTile = memo(MetricTileInner);

/**
 * Responsive grid wrapping `MetricTile`s. Defaults to a 2-up phone /
 * 3-up tablet / 5-up desktop split — matches Polymarket's KPI strip.
 */
export function MetricGrid({
  children,
  className,
  cols = "5",
}: {
  children: ReactNode;
  className?: string;
  cols?: "3" | "4" | "5" | "6";
}) {
  const colsCls =
    cols === "3"
      ? "grid-cols-2 sm:grid-cols-3"
      : cols === "4"
        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        : cols === "6"
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
  return (
    <div className={cn("grid gap-2", colsCls, className)}>{children}</div>
  );
}
