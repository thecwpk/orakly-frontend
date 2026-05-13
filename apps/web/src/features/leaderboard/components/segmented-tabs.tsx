"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  id: T;
  label: string;
  /** Optional subtitle shown beneath the label on lg+ for window tabs. */
  subtitle?: string;
};

export type SegmentedTabsProps<T extends string> = {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
  /** `pills` (compact) or `tabs` (taller, with subtitles). */
  size?: "pills" | "tabs";
  className?: string;
};

/** Animated segmented control with `layoutId` active-pill morph. */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "pills",
  className,
}: SegmentedTabsProps<T>) {
  const layoutId = useId();
  const isTabs = size === "tabs";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-stretch rounded-lg bg-black/30 p-1 ring-1 ring-white/[0.08]",
        isTabs ? "gap-0.5" : "gap-0",
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-md transition",
              isTabs ? "min-w-[64px] px-3 py-1.5" : "px-2.5 py-1",
              "text-[11px] font-bold tracking-tight",
              isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                aria-hidden
                className="absolute inset-0 rounded-md bg-white/[0.08] shadow-inner shadow-cyan-500/10 ring-1 ring-cyan-400/30"
                transition={{ type: "spring", stiffness: 460, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10">{opt.label}</span>
            {isTabs && opt.subtitle ? (
              <span
                className={cn(
                  "relative z-10 mt-0.5 hidden text-[9px] font-medium uppercase tracking-wider lg:block",
                  isActive ? "text-cyan-300/80" : "text-zinc-600",
                )}
              >
                {opt.subtitle}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
