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
        "inline-flex items-center gap-0.5 rounded-md bg-[var(--hub-bg-subtle)] p-0.5 ring-1 ring-[var(--hub-border)]",
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
                ? "text-[var(--hub-fg)]"
                : "text-[var(--hub-muted)] hover:text-[var(--hub-muted)]",
            )}
          >
            {isActive ? (
              <motion.span
                aria-hidden
                layoutId="activity-filter-active"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="absolute inset-0 -z-10 rounded-sm bg-[var(--hub-card-hover)] ring-1 ring-[var(--hub-border)]"
              />
            ) : null}
            <span>{opt.label}</span>
            {count > 0 ? (
              <span
                className={cn(
                  "rounded-md px-1 py-px font-mono text-[9.5px] tabular-nums leading-none",
                  isActive
                    ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/25"
                    : "bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)]",
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
