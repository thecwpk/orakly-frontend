"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCountUp } from "../hooks/use-count-up";

export type StatCardTone = "neutral" | "violet" | "cyan" | "emerald" | "amber" | "rose";

const TONE: Record<StatCardTone, { ring: string; bg: string; icon: string; text: string }> = {
  neutral: {
    ring: "ring-white/[0.06]",
    bg: "bg-white/[0.04]",
    icon: "text-zinc-300",
    text: "text-zinc-100",
  },
  violet: {
    ring: "ring-violet-400/30",
    bg: "bg-violet-500/12",
    icon: "text-violet-300",
    text: "text-violet-100",
  },
  cyan: {
    ring: "ring-cyan-400/30",
    bg: "bg-cyan-500/12",
    icon: "text-cyan-300",
    text: "text-cyan-100",
  },
  emerald: {
    ring: "ring-emerald-400/30",
    bg: "bg-emerald-500/12",
    icon: "text-emerald-300",
    text: "text-emerald-100",
  },
  amber: {
    ring: "ring-amber-400/30",
    bg: "bg-amber-500/12",
    icon: "text-amber-300",
    text: "text-amber-100",
  },
  rose: {
    ring: "ring-rose-400/30",
    bg: "bg-rose-500/12",
    icon: "text-rose-300",
    text: "text-rose-100",
  },
};

export type StatCardProps = {
  label: string;
  /** Numeric source — animated up to. Use `display` to control formatting. */
  value: number;
  /** Custom display for the animated number. Receives the live animated value. */
  display: (animated: number) => string;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: StatCardTone;
  /** Render at small density (used in 6-up grids). */
  compact?: boolean;
  className?: string;
};

function StatCardInner({
  label,
  value,
  display,
  hint,
  icon: Icon,
  tone = "neutral",
  compact,
  className,
}: StatCardProps) {
  const animated = useCountUp(value);
  const t = TONE[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-black/30 px-4 py-3 ring-1 transition",
        t.ring,
        compact && "px-3 py-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {Icon ? (
          <span
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md ring-1",
              t.bg,
              t.ring,
              t.icon,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-2 font-mono font-semibold leading-none tabular-nums",
          t.text,
          compact ? "text-[18px]" : "text-[22px] sm:text-[26px]",
        )}
      >
        {display(animated)}
      </p>
      {hint ? (
        <p className="mt-1.5 truncate text-[10.5px] text-zinc-500">{hint}</p>
      ) : null}
    </motion.div>
  );
}

export const StatCard = memo(StatCardInner);
