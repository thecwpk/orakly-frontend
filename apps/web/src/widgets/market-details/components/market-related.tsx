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
    <div className="glass-panel-strong overflow-hidden rounded-2xl">
      <div className="border-b border-white/6 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Related</p>
        <p className="text-sm font-medium text-white">Same category</p>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-2">
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
