"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { apiClient } from "@/api/client/http-client";
import { MarketCard } from "@/features/markets/components/market-card";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { queryKeys } from "@/shared/api/query-keys";
import { unwrapApiResult } from "@/shared/api/unwrap";
import type { LiveMarketCardDto } from "@/shared/contracts/live-markets";

type LiveTab = "trending" | "volume" | "newest" | "ending";

const TABS: { id: LiveTab; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "volume", label: "Highest Volume" },
  { id: "newest", label: "New" },
  { id: "ending", label: "Ending Soon" },
];

async function fetchLiveMarkets(
  tab: LiveTab,
  limit = 6,
): Promise<LiveMarketCardDto[]> {
  const qs = new URLSearchParams({
    status: "OPEN",
    limit: String(limit),
    sort: tab,
  });
  const res = await apiClient.request<LiveMarketCardDto[]>(
    `/api/v1/markets?${qs.toString()}`,
  );
  return unwrapApiResult(res);
}

function LiveMarketSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/5 bg-[var(--background-card)]">
      <div className="h-20 w-full bg-white/5" />
      <div className="space-y-3 p-4">
        <div className="space-y-2">
          <div className="h-3.5 w-[90%] rounded bg-white/10" />
          <div className="h-3.5 w-[60%] rounded bg-white/5" />
        </div>
        <div className="h-4 w-20 rounded bg-white/5" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-white/5" />
          <div className="h-1.5 w-full rounded-full bg-white/5" />
          <div className="h-3 w-full rounded bg-white/5" />
        </div>
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-12 rounded bg-white/5" />
          <div className="h-3 w-12 rounded bg-white/5" />
          <div className="h-3 w-16 rounded bg-white/5" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-9 rounded-lg bg-white/5" />
          <div className="h-9 rounded-lg bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function LiveMarketsEmpty() {
  return (
    <div className="col-span-full">
      <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
        <div className="mb-4 text-4xl" aria-hidden>
          🚀
        </div>
        <p className="text-lg font-semibold text-white">Markets launching soon</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          The first markets are being prepared. Check back shortly or submit a community idea.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={ROUTES.marketsCommunity}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Submit Market Idea
          </Link>
          <Link
            href={ROUTES.markets}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Browse All Markets
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Hub Live Markets card — Polymarket redesign via shared `MarketCard`. */
export function LiveMarketCard({
  market,
  index = 0,
}: {
  market: LiveMarketCardDto;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
    >
      <MarketCard
        market={market}
        isLive={market.status === "OPEN"}
        narrative={market.narrative}
        participants={market.participants}
      />
    </motion.div>
  );
}

/**
 * Section 3 — Live Markets: tabbed tradable market cards.
 */
export function LiveMarkets() {
  const [tab, setTab] = useState<LiveTab>("trending");

  const query = useQuery({
    queryKey: queryKeys.hub.liveMarkets(tab, 6),
    queryFn: () => fetchLiveMarkets(tab, 6),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const markets = useMemo(() => (query.data ?? []).slice(0, 6), [query.data]);
  const loading = query.isLoading && markets.length === 0;
  const empty = !loading && markets.length === 0;

  return (
    <section className="hub-section" aria-label="Live Markets">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Live Markets</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Active prediction markets on BSC Testnet
          </p>
        </div>
        <Link
          href={ROUTES.markets}
          className="text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          View All →
        </Link>
      </div>

      <div
        className="flex w-fit gap-1 rounded-xl bg-white/5 p-1"
        role="tablist"
        aria-label="Market sort"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm transition-all",
                active
                  ? "bg-white/10 font-medium text-white"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <LiveMarketSkeleton key={i} />)
        ) : empty ? (
          <LiveMarketsEmpty />
        ) : (
          markets.map((market, index) => (
            <LiveMarketCard key={market.id} market={market} index={index} />
          ))
        )}
      </div>
    </section>
  );
}
