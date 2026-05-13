"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import { ACTIVITY_FILTERS, type ActivityFilter } from "../lib/types";
import { cn } from "@/lib/utils";

export type ActivityFilterTabsProps = {
  active: ActivityFilter;
  counts: Record<ActivityFilter, number>;
  onChange: (next: ActivityFilter) => void;
  className?: string;
};

function ActivityFilterTabsImpl({
  active,
  counts,
  onChange,
  className,
}: ActivityFilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Activity filter"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-black/30 p-0.5 ring-1 ring-white/[0.08]",
        className,
      )}
    >
      {ACTIVITY_FILTERS.map((opt) => {
        const isActive = active === opt.id;
        const count = counts[opt.id] ?? 0;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-bold transition",
              isActive
                ? "text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {isActive ? (
              <motion.span
                aria-hidden
                layoutId="activity-filter-active"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 -z-10 rounded-sm bg-white/[0.08] ring-1 ring-white/[0.08]"
              />
            ) : null}
            <span>{opt.label}</span>
            {count > 0 ? (
              <span
                className={cn(
                  "rounded-md px-1 py-px font-mono text-[9.5px] tabular-nums leading-none",
                  isActive
                    ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/25"
                    : "bg-white/[0.04] text-zinc-500 ring-1 ring-white/[0.06]",
                )}
              >
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export const ActivityFilterTabs = memo(ActivityFilterTabsImpl);
