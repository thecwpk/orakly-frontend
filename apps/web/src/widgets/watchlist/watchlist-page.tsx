"use client";

import type { Market } from "@orakly/types";
import { motion } from "framer-motion";
import { ArrowUpRight, Star } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { TrendingMarketCard } from "@/widgets/trending-prediction-markets/components/trending-market-card";
import { useMarketsFeedQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import {
  selectWatchlistCount,
  useWatchlist,
  useWatchlistStore,
} from "@/features/watchlist";

const ACCENTS = ["cyan", "violet", "emerald", "rose", "amber"] as const;

function EmptyState() {
  return (
    <div className="hub-card rounded-xl px-4 py-7 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--hub-primary-soft)] ring-1 ring-[var(--hub-border)]">
        <Star className="h-4 w-4 text-[var(--hub-primary-bright)]" />
      </div>
      <h2 className="mt-2.5 text-[15px] font-semibold tracking-tight text-[var(--hub-fg)]">
        Watchlist empty
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-[11.5px] leading-snug text-[var(--hub-muted)]">
        Star markets from the explorer or detail page — synced locally.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Link href={ROUTES.markets} className="hub-btn-primary inline-flex items-center gap-1.5">
          Open markets
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <Link href={ROUTES.dapp} className="hub-btn-secondary inline-flex items-center gap-1.5">
          Home
        </Link>
      </div>
    </div>
  );
}

function MissingStarred({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <div className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2 text-[11.5px] text-[var(--hub-muted)]">
      <span className="font-medium text-[var(--hub-fg)]">{ids.length}</span>{" "}
      starred markets aren&apos;t currently in the live feed (likely closed or paused).
    </div>
  );
}

export function WatchlistPage() {
  const { watchlist } = useWatchlist();
  const count = useWatchlistStore(selectWatchlistCount);
  const clear = useWatchlistStore((s) => s.clear);
  const { data, isLoading } = useMarketsFeedQuery();

  const { matched, missingIds } = useMemo(() => {
    if (!data) return { matched: [] as Market[], missingIds: [] as string[] };
    const byId = new Map(data.map((m) => [m.id, m] as const));
    const ordered: Market[] = [];
    const missing: string[] = [];
    for (const id of watchlist) {
      const m = byId.get(id);
      if (m) ordered.push(m);
      else missing.push(id);
    }
    return { matched: ordered, missingIds: missing };
  }, [data, watchlist]);

  return (
    <main className="hub-container hub-root max-w-[90rem] pb-s48 pt-r24 sm:pb-s64 sm:pt-s40">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--hub-primary-bright)]">
            Curated
          </p>
          <h1 className="hub-section-title mt-1 flex items-baseline gap-2">
            Watchlist
            <span className="font-mono text-[14px] font-semibold text-[var(--hub-muted)]">
              {count}
            </span>
          </h1>
          <p className="hub-section-sub mt-1 text-[11.5px]">
            Starred markets from your session (local).
          </p>
        </div>
        {count > 0 ? (
          <button
            type="button"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm("Clear your entire watchlist?")
              ) {
                clear();
              }
            }}
            className="rounded-md border border-[var(--hub-border)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--hub-muted)] transition hover:border-[var(--hub-danger)]/40 hover:bg-[var(--hub-danger-bg)] hover:text-[var(--hub-danger)]"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="mt-6">
        {count === 0 ? (
          <EmptyState />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer h-[148px] rounded-xl ring-1 ring-[var(--hub-border)]"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {matched.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {matched.map((m, idx) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <TrendingMarketCard
                      market={m}
                      index={idx}
                      accent={ACCENTS[idx % ACCENTS.length]}
                      chrome="subtle"
                      variant="compact"
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
            <MissingStarred ids={missingIds} />
          </div>
        )}
      </div>
    </main>
  );
}
