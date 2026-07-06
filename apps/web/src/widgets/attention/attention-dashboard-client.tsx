"use client";

import { useQueries } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  fetchAttentionDashboard,
  fetchAttentionRotation,
} from "@/shared/api/fetchers/attention-dashboard";
import { queryKeys } from "@/shared/api/query-keys";
import { AttentionHeatmap } from "@/widgets/attention/components/attention-heatmap";
import { AttentionScoreCard } from "@/widgets/attention/components/attention-score-card";
import { NarrativeRotation } from "@/widgets/attention/components/narrative-rotation";

const DASHBOARD_LIMIT = 20;
const REFETCH_MS = 30_000;

function formatRelativeUpdated(iso: string | undefined): string {
  if (!iso) return "Updated recently";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Updated just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Updated just now";
  if (minutes === 1) return "Updated 1 min ago";
  if (minutes < 60) return `Updated ${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Updated 1 hour ago";
  return `Updated ${hours} hours ago`;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {children}
      </h2>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function HeatmapSkeleton() {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={`heatmap-skeleton-${index}`}
          className="h-24 animate-pulse rounded-xl bg-gray-200"
        />
      ))}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`card-skeleton-${index}`}
          className="h-56 animate-pulse rounded-xl bg-gray-200"
        />
      ))}
    </div>
  );
}

export function AttentionDashboardClient() {
  const router = useRouter();

  const [dashboardQuery, rotationQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.hub.attentionDashboard(DASHBOARD_LIMIT),
        queryFn: () => fetchAttentionDashboard(DASHBOARD_LIMIT),
        refetchInterval: REFETCH_MS,
        staleTime: 15_000,
      },
      {
        queryKey: queryKeys.hub.attentionRotation(),
        queryFn: fetchAttentionRotation,
        refetchInterval: REFETCH_MS,
        staleTime: 15_000,
      },
    ],
  });

  const narratives = useMemo(() => {
    const items = dashboardQuery.data?.data ?? [];
    return items.map((item) => ({
      narrativeSlug: item.narrativeSlug,
      narrativeName: item.narrativeName,
      attentionScore: item.attentionScore,
      momentum: item.momentum,
      activeMarkets: item.activeMarkets,
      volume24hUsd: item.volume24hUsd,
      uniqueTraders: item.uniqueTraders,
      convictionScore: item.convictionScore,
    }));
  }, [dashboardQuery.data]);

  const sortedCards = useMemo(
    () =>
      [...(dashboardQuery.data?.data ?? [])].sort(
        (a, b) => b.attentionScore - a.attentionScore,
      ),
    [dashboardQuery.data],
  );

  const navigateToNarrative = (slug: string) => {
    router.push(`/narratives/${slug}`);
  };

  const dashboardLoading = dashboardQuery.isLoading;
  const dashboardError = dashboardQuery.isError;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Crypto Attention Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Live narrative intelligence — updated after every market event
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium text-gray-500">
          {formatRelativeUpdated(dashboardQuery.data?.updatedAt)}
        </p>
      </div>

      {dashboardError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          {dashboardQuery.error?.message ?? "Failed to load attention dashboard."}
        </div>
      ) : null}

      <section className="space-y-4">
        {dashboardLoading ? (
          <HeatmapSkeleton />
        ) : (
          <AttentionHeatmap
            narratives={narratives}
            onNarrativeClick={navigateToNarrative}
          />
        )}
      </section>

      <SectionLabel>Detailed Scores</SectionLabel>

      <section>
        {dashboardLoading ? (
          <CardsSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedCards.map((item) => (
              <AttentionScoreCard
                key={item.id}
                narrativeName={item.narrativeName}
                narrativeSlug={item.narrativeSlug}
                attentionScore={item.attentionScore}
                convictionScore={item.convictionScore}
                momentum={item.momentum}
                volume24hUsd={item.volume24hUsd}
                activeMarkets={item.activeMarkets}
                uniqueTraders={item.uniqueTraders}
                liquidity={item.liquidity}
                openInterest={item.openInterest}
                onClick={() => navigateToNarrative(item.narrativeSlug)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Narrative Rotation</h2>
        {rotationQuery.isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-gray-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" aria-label="Loading rotation" />
          </div>
        ) : rotationQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
            {rotationQuery.error?.message ?? "Failed to load narrative rotation."}
          </div>
        ) : (
          <NarrativeRotation
            flows={rotationQuery.data?.flows ?? []}
            gainers={rotationQuery.data?.gainers ?? []}
            losers={rotationQuery.data?.losers ?? []}
          />
        )}
      </section>
    </div>
  );
}
