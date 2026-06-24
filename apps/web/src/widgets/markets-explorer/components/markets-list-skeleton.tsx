"use client";

import { MarketCardRowSkeleton } from "@/features/markets/components/market-card-skeleton";

export function MarketsListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]">
      <div className="grid items-center gap-3 px-3 py-2 text-[10.5px] uppercase tracking-[0.18em] text-[var(--hub-muted)] [grid-template-columns:34px_minmax(0,1fr)_minmax(0,11rem)_5.5rem_5rem_4.5rem_2.25rem_5rem]">
        <span>#</span>
        <span>Market</span>
        <span>Probability</span>
        <span className="text-right">7d</span>
        <span className="text-right">Vol</span>
        <span className="hidden text-right md:block">Liq</span>
        <span />
        <span className="text-right">Closes</span>
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <MarketCardRowSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
