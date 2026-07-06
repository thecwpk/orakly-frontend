"use client";

import { useQuery } from "@tanstack/react-query";
import { MarketCard } from "@/features/markets/components/market-card";
import { fetchNarrativeMarkets } from "@/shared/api/fetchers/narrative-detail";
import { queryKeys } from "@/shared/api/query-keys";

const ACCENTS = ["cyan", "violet", "emerald", "rose", "amber"] as const;

type NarrativeRelatedMarketsProps = {
  slug: string;
};

export function NarrativeRelatedMarkets({ slug }: NarrativeRelatedMarketsProps) {
  const { data: markets = [], isLoading } = useQuery({
    queryKey: queryKeys.hub.narrativeMarkets(slug, 20),
    queryFn: () => fetchNarrativeMarkets(slug, 20),
    staleTime: 45_000,
  });

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Related markets
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`market-skeleton-${index}`}
              className="h-48 animate-pulse rounded-xl bg-gray-200"
            />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No markets in this narrative yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((market, index) => (
            <MarketCard
              key={market.id}
              market={market}
              variant="default"
              accent={ACCENTS[index % ACCENTS.length]}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
