"use client";

import type { Market } from "@orakly/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bitcoin,
  Coins,
  Flame,
  LayoutGrid,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMarketsFeedQuery } from "@/shared/api/hooks/useMarketsFeedQuery";
import { invalidateMarketsFeed } from "@/shared/api/invalidate";
import { ROUTES } from "@/shared/constants/routes";
import { Section, Stack } from "@/shared/ui";
import { cn } from "@/lib/utils";
import { CategoryFilter, type CategoryFilterOption } from "./components/category-filter";
import { TrendingMarketCard } from "./components/trending-market-card";
import { TrendingMarketGridSkeleton } from "./components/trending-market-card-skeleton";
import { useLiveMarketStatus } from "./lib/use-live-market-status";

const ACCENTS = ["cyan", "violet", "emerald", "rose", "amber"] as const;
type Accent = (typeof ACCENTS)[number];

type CategoryId = "all" | "btc" | "eth" | "alts" | "macro" | "memes";

type CategoryDef = {
  id: CategoryId;
  label: string;
  icon: typeof LayoutGrid;
  predicate: (m: Market) => boolean;
};

const CATEGORIES: ReadonlyArray<CategoryDef> = [
  { id: "all", label: "All", icon: LayoutGrid, predicate: () => true },
  {
    id: "btc",
    label: "BTC",
    icon: Bitcoin,
    predicate: (m) =>
      /\bbtc\b|bitcoin/i.test(m.title) || /\bbtc\b|bitcoin/i.test(m.category),
  },
  {
    id: "eth",
    label: "ETH",
    icon: Coins,
    predicate: (m) =>
      /\beth\b|ethereum/i.test(m.title) || /\beth\b|ethereum/i.test(m.category),
  },
  {
    id: "alts",
    label: "Altcoins",
    icon: Sparkles,
    predicate: (m) => {
      const t = `${m.title} ${m.category}`.toLowerCase();
      const isCrypto = t.includes("crypto") || t.includes("alt");
      const isBtc = /\bbtc\b|bitcoin/i.test(t);
      const isEth = /\beth\b|ethereum/i.test(t);
      const tickers = ["sol", "ada", "avax", "doge", "xrp", "ton"];
      return (
        (isCrypto && !isBtc && !isEth) ||
        tickers.some((s) => t.includes(s))
      );
    },
  },
  {
    id: "macro",
    label: "Macro",
    icon: TrendingUp,
    predicate: (m) =>
      /macro|fed|cpi|rate|ecb|gdp|inflation/i.test(m.title) ||
      /macro/i.test(m.category),
  },
  {
    id: "memes",
    label: "Memes",
    icon: Flame,
    predicate: (m) =>
      /meme/i.test(m.category) ||
      /pepe|wif|doge|shib|bonk/i.test(m.title.toLowerCase()),
  },
] as const;

const TOP_N = 9;

type Props = {
  /** Override the visible card count (defaults to 9). */
  limit?: number;
  /** Heading and rail copy. */
  title?: string;
  description?: string;
  /** Optional initial category. */
  initialCategoryId?: CategoryId;
  /** Suppress the eyebrow/title block — useful when embedded under a page header. */
  hideHeader?: boolean;
};

export function TrendingPredictionMarketsSection({
  limit = TOP_N,
  title = "Trending crypto prediction markets",
  description = "Highest-velocity pools right now — filtered by category, ranked by 24h notional, with live trade pulses and probability sparklines.",
  initialCategoryId = "all",
  hideHeader = false,
}: Props) {
  const qc = useQueryClient();
  const { data, isLoading, isFetching, isError, refetch, dataUpdatedAt } =
    useMarketsFeedQuery();
  const [active, setActive] = useState<CategoryId>(initialCategoryId);

  const all = useMemo(() => data ?? [], [data]);

  const counts = useMemo(() => {
    const m: Partial<Record<CategoryId, number>> = {};
    for (const cat of CATEGORIES) {
      m[cat.id] = all.filter(cat.predicate).length;
    }
    return m;
  }, [all]);

  const filterOptions: CategoryFilterOption[] = CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    count: counts[c.id],
  }));

  const ranked = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === active) ?? CATEGORIES[0]!;
    const subset = all.filter(cat.predicate);
    const fallback = subset.length > 0 ? subset : all;
    return [...fallback]
      .sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0))
      .slice(0, limit);
  }, [active, all, limit]);

  const visibleIds = useMemo(() => ranked.map((m) => m.id), [ranked]);
  const { liveSet, lastTradeAt } = useLiveMarketStatus(visibleIds);

  const volumeMax = useMemo(
    () => ranked.reduce((acc, m) => Math.max(acc, m.volumeUsd ?? 0), 0),
    [ranked],
  );

  const updatedAtLabel = useMemo(() => {
    if (!dataUpdatedAt) return null;
    const ms = Date.now() - dataUpdatedAt;
    if (ms < 1000) return "now";
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
    return `${Math.floor(ms / 60_000)}m ago`;
  }, [dataUpdatedAt]);

  const onRefresh = () => invalidateMarketsFeed(qc);

  const empty = !isLoading && !isError && ranked.length === 0;

  return (
    <Section spacing={hideHeader ? "tight" : "default"} width="lg">
      <Stack gap="lg">
        {!hideHeader ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-yes/90">
                <TrendingUp className="h-3 w-3" />
                Liquidity radar
              </p>
              <h2 className="mt-1.5 text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-[1.55rem]">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              {updatedAtLabel ? (
                <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                  Updated {updatedAtLabel}
                </span>
              ) : null}
              <button
                type="button"
                onClick={onRefresh}
                disabled={isFetching}
                aria-label="Refresh trending markets"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 text-foreground ring-1 ring-border transition",
                  "hover:bg-muted/70",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <RefreshCw
                  className={cn(
                    "h-3.5 w-3.5",
                    isFetching && "animate-spin",
                  )}
                />
              </button>
              <Link
                href={ROUTES.marketsTrending}
                className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-yes/90 ring-1 ring-border transition hover:bg-yes/10 hover:text-yes"
              >
                See all →
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            {updatedAtLabel ? (
              <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                Updated {updatedAtLabel}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isFetching}
              aria-label="Refresh trending markets"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 text-foreground ring-1 ring-border transition",
                "hover:bg-muted/70",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  isFetching && "animate-spin",
                )}
              />
            </button>
          </div>
        )}

        {/* filters */}
        <CategoryFilter
          options={filterOptions}
          active={active}
          onSelect={(id) => setActive(id as CategoryId)}
        />

        {/* grid */}
        {isError ? (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-rose-500/[0.06] p-8 text-center ring-1 ring-rose-400/20">
            <p className="text-[13px] font-medium text-foreground">
              Couldn&apos;t load markets
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-md bg-card px-3 py-1.5 text-[12px] font-medium text-foreground ring-1 ring-border transition hover:bg-muted/50"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <TrendingMarketGridSkeleton count={limit} />
        ) : empty ? (
          <div className="rounded-xl bg-muted/15 px-4 py-10 text-center text-[12.5px] text-muted-foreground ring-1 ring-border">
            No markets in this category yet — try a different filter.
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {ranked.map((m, i) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                >
                  <TrendingMarketCard
                    market={m}
                    index={i}
                    accent={ACCENTS[i % ACCENTS.length] as Accent}
                    volumeMax={volumeMax}
                    isLive={liveSet.has(m.id)}
                    lastTradeAt={lastTradeAt.get(m.id) ?? null}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </Stack>
    </Section>
  );
}
