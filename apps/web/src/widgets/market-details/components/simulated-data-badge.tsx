"use client";

import { cn } from "@/lib/utils";

/** Small label when UI uses client-generated placeholder data (not live venue feed). */
export function SimulatedDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md bg-amber-500/12 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-amber-200/95 ring-1 ring-amber-500/28",
        className,
      )}
      title="Illustrative data until live market feeds are connected"
    >
      Preview
    </span>
  );
}
