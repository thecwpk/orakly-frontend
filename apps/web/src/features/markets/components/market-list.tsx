"use client";

import { MarketCard } from "@/features/markets/components/market-card";
import { MarketCardGridSkeleton } from "@/features/markets/components/market-card-skeleton";
import { useFeaturedMarkets } from "@/features/markets/hooks/use-featured-markets";
import { useMarketsFilterStore } from "@/features/markets/store/use-markets-filter-store";

const ACCENTS = ["cyan", "violet", "emerald", "rose", "amber"] as const;

export function MarketList() {
  const { data = [], isLoading } = useFeaturedMarkets();
  const searchTerm = useMarketsFilterStore((state) => state.searchTerm);

  if (isLoading) {
    return <MarketCardGridSkeleton count={6} />;
  }

  const q = searchTerm.toLowerCase().trim();
  const filtered = q
    ? data.filter((m) => m.title.toLowerCase().includes(q))
    : data;

  const volumeMax = filtered.reduce(
    (acc, m) => Math.max(acc, m.volumeUsd ?? 0),
    0,
  );

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((m, i) => (
        <MarketCard
          key={m.id}
          market={m}
          index={i}
          accent={ACCENTS[i % ACCENTS.length]}
          volumeMax={volumeMax}
        />
      ))}
    </section>
  );
}
