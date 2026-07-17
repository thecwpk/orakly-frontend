"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { compactUsd, signedCompactUsd, signedPct } from "../lib/format";
import { useCountUp } from "../hooks/use-count-up";

export type AnimatedStatTone = "neutral" | "emerald" | "rose" | "cyan" | "violet" | "amber";

export type AnimatedStatProps = {
  label: string;
  value: number;
  /** How to format the animated number. */
  format?: "usd" | "signed-usd" | "pct" | "signed-pct" | "int";
  /** Sub-label hint shown beneath the value. */
  hint?: string;
  /** Tone of the value. */
  tone?: AnimatedStatTone;
  /** Optional icon node rendered next to the label. */
  icon?: React.ReactNode;
  /** Animation duration in ms — defaults to 900. */
  duration?: number;
  /** Smaller density variant. */
  size?: "sm" | "md";
  className?: string;
};

const TONE: Record<AnimatedStatTone, string> = {
  neutral: "text-[var(--hub-fg)]",
  emerald: "text-emerald-200",
  rose: "text-rose-200",
  cyan: "text-cyan-200",
  violet: "text-violet-200",
  amber: "text-amber-200",
};

function formatValue(n: number, fmt: AnimatedStatProps["format"] = "int"): string {
  if (!Number.isFinite(n)) return "N/A";
  switch (fmt) {
    case "usd":
      return compactUsd(n);
    case "signed-usd":
      return signedCompactUsd(n);
    case "pct":
      return `${n.toFixed(1)}%`;
    case "signed-pct":
      return signedPct(n);
    case "int":
    default:
      return Math.round(n).toLocaleString();
  }
}

function AnimatedStatInner({
  label,
  value,
  format = "int",
  hint,
  tone = "neutral",
  icon,
  duration = 900,
  size = "md",
  className,
}: AnimatedStatProps) {
  const animated = useCountUp({ to: value, duration });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl bg-[var(--hub-bg-subtle)] ring-1 ring-[var(--hub-border)]",
        size === "sm" ? "px-3 py-2" : "px-3.5 py-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-1 font-mono font-semibold leading-none tabular-nums",
          TONE[tone],
          size === "sm" ? "text-[15px]" : "text-[18px] sm:text-[20px]",
        )}
      >
        {formatValue(animated, format)}
      </p>
      {hint ? (
        <p className="mt-1 text-[10.5px] text-[var(--hub-muted)]">{hint}</p>
      ) : null}
    </motion.div>
  );
}

export const AnimatedStat = memo(AnimatedStatInner);
