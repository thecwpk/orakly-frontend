"use client";

import type { Market } from "@orakly/types";
import { DenseMarketCard } from "@/widgets/landing/components/dense-market-card";
import { memo, useMemo } from "react";
import { marketDetailPanelClass } from "./market-detail-section";
import { cn } from "@/lib/utils";

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
    <div className={cn(marketDetailPanelClass, "min-w-0 overflow-x-hidden p-2.5")}>
      <div className="grid min-w-0 gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))] [&>a]:min-w-0">
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
