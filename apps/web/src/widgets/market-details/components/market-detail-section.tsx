"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared surface + rhythm for market detail panels. */
export const marketDetailPanelClass =
  "rounded-lg border border-white/[0.08] bg-[hsl(228_28%_10%/0.98)] ring-1 ring-white/[0.06]";

export function MarketDetailSection({
  title,
  hint,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {title}
          </h2>
          {hint ? (
            <p className="mt-0.5 truncate text-[11px] text-zinc-600">{hint}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("min-w-0", bodyClassName)}>{children}</div>
    </section>
  );
}
