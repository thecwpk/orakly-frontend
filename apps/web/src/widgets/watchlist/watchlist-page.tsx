"use client";

import type { Market } from "@orakly/types";
import { motion } from "framer-motion";
import { ArrowUpRight, Star } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useMarketsFeedQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { Section, Stack } from "@/shared/ui";
import {
  WatchlistStar,
  selectWatchlistCount,
  useWatchlistStore,
} from "@/features/watchlist";
import { DenseMarketCard } from "@/widgets/landing/components/dense-market-card";
import { cn } from "@/lib/utils";

const ACCENTS = ["cyan", "violet", "rose"] as const;
type Accent = (typeof ACCENTS)[number];

function EmptyState() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-7 text-center ring-1 ring-white/[0.04]">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-amber-300/25">
        <Star className="h-4 w-4 text-amber-300" />
      </div>
      <h2 className="mt-2.5 text-[15px] font-semibold tracking-tight text-white">
        Watchlist empty
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-[11.5px] leading-snug text-zinc-500">
        Star markets from the explorer or detail page — synced locally.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={ROUTES.marketsBrowse}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/12 px-3 py-2 text-[12px] font-semibold text-cyan-100 ring-1 ring-cyan-400/25 transition hover:bg-cyan-500/18"
        >
          Open markets
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={ROUTES.marketsBrowse}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.07]"
        >
          Hub
        </Link>
      </div>
    </div>
  );
}

function MissingStarred({ slugs }: { slugs: string[] }) {
  if (slugs.length === 0) return null;
  return (
    <div className="rounded-lg bg-white/[0.02] px-3 py-2 text-[11.5px] text-zinc-500 ring-1 ring-white/[0.05]">
      <span className="font-medium text-zinc-300">{slugs.length}</span>{" "}
      starred markets aren&apos;t currently in the live feed (likely closed or
      paused).
    </div>
  );
}

export function WatchlistPage() {
  const slugs = useWatchlistStore((s) => s.slugs);
  const count = useWatchlistStore(selectWatchlistCount);
  const clear = useWatchlistStore((s) => s.clear);
  const { data, isLoading } = useMarketsFeedQuery();

  const { matched, missingSlugs } = useMemo(() => {
    if (!data) return { matched: [] as Market[], missingSlugs: [] as string[] };
    const bySlug = new Map(data.map((m) => [m.slug, m] as const));
    const ordered: Market[] = [];
    const missing: string[] = [];
    for (const slug of slugs) {
      const m = bySlug.get(slug);
      if (m) ordered.push(m);
      else missing.push(slug);
    }
    return { matched: ordered, missingSlugs: missing };
  }, [data, slugs]);

  return (
    <Section spacing="tight" width="lg">
      <Stack gap="md">
        <div className="flex flex-wrap items-end justify-between gap-r16">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
              <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />
              Curated
            </p>
            <h1 className="mt-1.5 flex items-baseline gap-2 text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
              Watchlist
              <span className="font-mono text-[14px] font-semibold text-zinc-500">
                {count}
              </span>
            </h1>
            <p className="mt-1 max-w-xl text-[11.5px] text-zinc-500">
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
              className="rounded-md px-2.5 py-1.5 text-[12px] font-medium text-zinc-500 ring-1 ring-white/[0.06] transition hover:bg-rose-500/[0.08] hover:text-rose-200"
            >
              Clear all
            </button>
          ) : null}
        </div>

        {count === 0 ? (
          <EmptyState />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-r16 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "skeleton-shimmer h-[148px] rounded-xl bg-white/[0.03] ring-1 ring-white/[0.05]",
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          <Stack gap="md">
            {matched.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 gap-r16 sm:grid-cols-2 lg:grid-cols-3"
              >
                {matched.map((m, idx) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="relative"
                  >
                    <DenseMarketCard
                      market={m}
                      index={idx}
                      accent={ACCENTS[idx % ACCENTS.length] as Accent}
                      href={ROUTES.market(m.slug)}
                    />
                    <div className="absolute right-2.5 top-2.5">
                      <WatchlistStar slug={m.slug} size="xs" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
            <MissingStarred slugs={missingSlugs} />
          </Stack>
        )}
      </Stack>
    </Section>
  );
}
