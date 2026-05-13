"use client";

import { Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryFilterOption = {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Live count of matching markets in the current dataset. */
  count?: number;
};

type Props = {
  options: ReadonlyArray<CategoryFilterOption>;
  active: string;
  onSelect: (id: string) => void;
  className?: string;
};

export function CategoryFilter({
  options,
  active,
  onSelect,
  className,
}: Props) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-background to-transparent sm:w-10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-background to-transparent sm:w-10"
      />
      <div
        role="tablist"
        aria-label="Filter trending markets by category"
        className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((opt) => {
          const isActive = opt.id === active;
          const Icon = opt.icon ?? Sparkles;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(opt.id)}
              className={cn(
                "relative shrink-0 snap-start rounded-full border px-3 py-2 text-left text-[12px] font-medium transition-[border-color,background-color,color,box-shadow]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-yes/40 bg-yes/10 text-yes shadow-[0_0_24px_-10px_color-mix(in_srgb,var(--yes)_40%,transparent)] ring-1 ring-yes/20"
                  : "border-border bg-card/70 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <span className="relative inline-flex items-center gap-1.5">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-yes" : "text-muted-foreground")} aria-hidden />
                <span>{opt.label}</span>
                {typeof opt.count === "number" ? (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-px font-mono text-[10px] font-semibold tabular-nums leading-none",
                      isActive
                        ? "bg-yes/15 text-yes ring-1 ring-yes/25"
                        : "bg-muted/80 text-muted-foreground ring-1 ring-border",
                    )}
                  >
                    {opt.count}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
