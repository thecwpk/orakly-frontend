"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared surface + rhythm for market detail panels. */
export const marketDetailPanelClass = "market-detail-panel";

export const marketDetailPanelMutedClass = "market-detail-panel market-detail-panel-muted";

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
          <h2 className="market-detail-section-title text-[11px]">
            {title}
          </h2>
          {hint ? (
            <p className="market-detail-section-hint mt-0.5 truncate text-[11px]">{hint}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("min-w-0", bodyClassName)}>{children}</div>
    </section>
  );
}
