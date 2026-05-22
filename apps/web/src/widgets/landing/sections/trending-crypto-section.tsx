"use client";

import { useMarketsFeedQuery } from "@/shared/api/hooks/useMarketsFeedQuery";
import { useMarketsFilterStore } from "@/features/markets/store/use-markets-filter-store";
import { DenseMarketCard } from "../components/dense-market-card";
import { SkeletonGrid } from "../components/landing-skeletons";
import { SectionShell } from "../components/section-shell";

export function TrendingCryptoSection() {
  const { data = [], isLoading } = useMarketsFeedQuery();
  const searchTerm = useMarketsFilterStore((s) => s.searchTerm);

  const crypto = data.filter(
    (m) =>
      m.category.toLowerCase().includes("crypto") ||
      m.title.toLowerCase().includes("btc") ||
      m.title.toLowerCase().includes("eth"),
  );
  const base = crypto.length ? crypto : data;
  const filtered = base.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );

  return (
    <SectionShell
      id="trending-crypto"
      eyebrow="Liquidity radar"
      title="Trending crypto markets"
      description="High-velocity pools with tight spreads — surfaced from live ingestion and internal routing."
      action={
        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-300 ring-1 ring-cyan-400/25">
          Updated continuously
        </span>
      }
    >
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
          {filtered.map((market, i) => (
            <DenseMarketCard
              key={market.id}
              market={market}
              href={`/markets/${market.slug}`}
              accent="cyan"
              index={i}
              openInNewTab
            />
          ))}
        </div>
      )}
    </SectionShell>
  );
}
