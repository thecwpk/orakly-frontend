"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Equal-height two-column row for market detail sections (md+). */
export function MarketDetailSplitRow({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 items-stretch gap-3 md:grid-cols-2 md:gap-4",
        className,
      )}
    >
      <div className={cn("flex min-h-0 min-w-0 flex-col", leftClassName)}>{left}</div>
      <div className={cn("flex min-h-0 min-w-0 flex-col", rightClassName)}>{right}</div>
    </div>
  );
}
