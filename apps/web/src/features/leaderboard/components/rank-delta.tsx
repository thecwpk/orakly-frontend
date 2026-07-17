"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact ranking delta arrow + magnitude. Positive = climbed up the board. */
export function RankDelta({
  delta,
  size = "sm",
  className,
}: {
  delta: number;
  size?: "xs" | "sm";
  className?: string;
}) {
  const isUp = delta > 0;
  const isDown = delta < 0;
  const Icon = isUp ? ChevronUp : isDown ? ChevronDown : Minus;
  const tone = isUp
    ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/30"
    : isDown
      ? "bg-rose-500/10 text-rose-200 ring-rose-400/30"
      : "bg-white/[0.04] text-zinc-500 ring-white/[0.06]";

  const dim = size === "xs" ? "h-4 px-1 text-[9.5px]" : "h-5 px-1.5 text-[10px]";
  const iconSize = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <motion.span
      key={`${delta}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 450, damping: 22 }}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md font-mono font-bold tabular-nums ring-1",
        dim,
        tone,
        className,
      )}
    >
      <Icon className={iconSize} />
      {delta === 0 ? "N/A" : Math.abs(delta)}
    </motion.span>
  );
}
