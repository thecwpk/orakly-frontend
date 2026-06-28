"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCountUp } from "../hooks/use-count-up";

export type StatCardTone = "neutral" | "violet" | "cyan" | "emerald" | "amber" | "rose";

const TONE: Record<StatCardTone, { ring: string; bg: string; icon: string; text: string }> = {
  neutral: {
    ring: "ring-[var(--hub-border)]",
    bg: "bg-[var(--hub-bg-subtle)]",
    icon: "text-[var(--hub-muted)]",
    text: "text-[var(--hub-fg)]",
  },
  violet: {
    ring: "ring-[var(--hub-border-strong)]",
    bg: "bg-[var(--hub-primary-soft)]",
    icon: "text-[var(--hub-primary-bright)]",
    text: "text-[var(--hub-fg)]",
  },
  cyan: {
    ring: "ring-[var(--hub-border-strong)]",
    bg: "bg-[var(--hub-primary-soft)]",
    icon: "text-[var(--hub-primary-bright)]",
    text: "text-[var(--hub-fg)]",
  },
  emerald: {
    ring: "ring-emerald-400/30",
    bg: "bg-[var(--hub-success-bg)]",
    icon: "text-[var(--hub-success)]",
    text: "text-[var(--hub-fg)]",
  },
  amber: {
    ring: "ring-amber-400/30",
    bg: "bg-amber-500/12",
    icon: "text-amber-300",
    text: "text-[var(--hub-fg)]",
  },
  rose: {
    ring: "ring-rose-400/30",
    bg: "bg-[var(--hub-danger-bg)]",
    icon: "text-[var(--hub-danger)]",
    text: "text-[var(--hub-fg)]",
  },
};

export type StatCardProps = {
  label: string;
  value: number;
  display: (animated: number) => string;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: StatCardTone;
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
        "hub-card relative overflow-hidden px-4 py-3 transition",
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
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
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
        <p className="mt-1.5 truncate text-[10.5px] text-[var(--hub-muted)]">{hint}</p>
      ) : null}
    </motion.div>
  );
}

export const StatCard = memo(StatCardInner);
