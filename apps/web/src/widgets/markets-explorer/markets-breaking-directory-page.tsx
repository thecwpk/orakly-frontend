"use client";

import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { useMarketsFeedScopedQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { Section } from "@/shared/ui";
import { TrendingMarketCard } from "@/widgets/trending-prediction-markets";
import { TrendingMarketGridSkeleton } from "@/widgets/trending-prediction-markets/components/trending-market-card-skeleton";
import { useLiveMarketStatus } from "@/widgets/trending-prediction-markets/lib/use-live-market-status";
import { cn } from "@/lib/utils";

const ACCENTS = ["cyan", "violet", "emerald", "rose"] as const;

/**
 * Dedicated breaking surface (`/markets/breaking`) — `lane=list` + `filter=breaking`
 * without the `/markets` canonical `trending` redirect fight.
 */
export function MarketsBreakingDirectoryPage() {
  const { data = [], isLoading, isError, error, refetch, isFetching } = useMarketsFeedScopedQuery({
    scope: "full",
    lane: "list",
    filter: "breaking",
    take: 120,
  });

  const ids = data.map((m) => m.id);
  const { liveSet } = useLiveMarketStatus(ids);

  return (
    <Section spacing="default" width="xl" className="pt-r24 pb-r32">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
            <Link
              href={ROUTES.dapp}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Hub
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yes/12 ring-1 ring-yes/25">
                <Zap className="size-6 text-yes" aria-hidden />
              </span>
              <div>
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                  Breaking markets
                </h1>
                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                  Open pools with freshly seen live/crypto signals (`signalLastSeenAt`). Matches the hub Breaking rail —
                  ingest more tape to populate this list when empty.
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className={cn(
                "rounded-lg border border-border bg-card/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:bg-muted/40 hover:text-foreground",
                isFetching && "opacity-70",
              )}
            >
              Refresh
            </button>
            <Link
              href={ROUTES.discover}
              className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-foreground ring-1 ring-border transition hover:bg-muted/30"
            >
              Discover →
            </Link>
          </div>
        </div>

        {isError ?
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive" role="alert">
            {(error as Error)?.message ?? "Could not load breaking markets"}
          </p>
        : isLoading ?
          <TrendingMarketGridSkeleton count={12} />
        : data.length === 0 ?
          <p className="rounded-xl border border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
            No breaking markets yet. When upstream signals link to open pools, they appear here and on the hub Breaking
            rail.
          </p>
        : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((m, i) => (
              <li key={m.id}>
                <TrendingMarketCard
                  market={m}
                  index={i}
                  accent={ACCENTS[i % ACCENTS.length]}
                  chrome="subtle"
                  isLive={liveSet.has(m.id)}
                />
              </li>
            ))}
          </ul>
        )}
    </Section>
  );
}
