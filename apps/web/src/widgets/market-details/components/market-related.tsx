"use client";

import type { Market } from "@orakly/types";
import { DenseMarketCard } from "@/widgets/landing/components/dense-market-card";
import { memo, useMemo } from "react";

function MarketRelatedInner({
  currentSlug,
  category,
  markets,
}: {
  currentSlug: string;
  category: string;
  markets: Market[] | undefined;
}) {
  const related = useMemo(() => {
    if (!markets?.length) return [];
    return markets
      .filter((m) => m.slug !== currentSlug && m.category === category)
      .slice(0, 6);
  }, [markets, category, currentSlug]);

  if (!related.length) return null;

  return (
    <div className="glass-panel-strong min-w-0 overflow-x-hidden rounded-2xl border border-white/[0.06] ring-1 ring-white/[0.04]">
      {/*
        auto-fit + minmax: never squash cards into toothpick columns (was xl:grid-cols-3 in ~half-width pane).
      */}
      <div className="grid min-w-0 gap-3 p-3 sm:gap-4 sm:p-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,278px),1fr))] [&>a]:min-w-0">
        {related.map((m, i) => (
          <DenseMarketCard
            key={m.slug}
            market={m}
            href={`/markets/${m.slug}`}
            accent={i % 3 === 0 ? "cyan" : i % 3 === 1 ? "violet" : "rose"}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

export const MarketRelated = memo(MarketRelatedInner);
