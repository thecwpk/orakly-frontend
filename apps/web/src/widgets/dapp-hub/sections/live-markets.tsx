"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCompactUsd } from "@orakly/utils";
import { apiClient } from "@/api/client/http-client";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { queryKeys } from "@/shared/api/query-keys";
import { unwrapApiResult } from "@/shared/api/unwrap";
import type { LiveMarketCardDto } from "@/shared/contracts/live-markets";
import { getDemoLiveMarkets } from "../lib/live-markets-demo";

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

function shortenCreator(raw: string): string {
  const t = raw.trim();
  if (!t) return "Anonymous";
  if (t.startsWith("0x") && t.length >= 12) {
    return `${t.slice(0, 6)}…${t.slice(-4)}`;
  }
  return t.length > 18 ? `${t.slice(0, 16)}…` : t;
}

function endsInLabel(iso: string): { label: string; urgent: boolean } {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return { label: "N/A", urgent: false };
  if (ms <= 0) return { label: "Ended", urgent: true };
  const urgent = ms < 24 * 60 * 60 * 1000;
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return { label: `${days}d ${hours}h`, urgent };
  if (hours > 0) return { label: `${hours}h ${mins}m`, urgent };
  return { label: `${Math.max(1, mins)}m`, urgent };
}

function LiveMarketSkeleton() {
  return (
    <div className="hub-dapp-skel-card">
      <div className="hub-dapp-skel mb-3 h-4 w-[92%]" />
      <div className="hub-dapp-skel mb-3 h-4 w-[58%]" />
      <div className="mb-3 flex gap-2">
        <div className="hub-dapp-skel h-5 w-16 rounded-md" />
        <div className="hub-dapp-skel h-5 w-20 rounded-md" />
      </div>
      <div className="hub-dapp-skel mb-2 h-2.5 w-20" />
      <div className="hub-dapp-skel mb-4 h-2 w-full rounded-full" />
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="hub-dapp-skel h-10 rounded-md" />
        <div className="hub-dapp-skel h-10 rounded-md" />
        <div className="hub-dapp-skel h-10 rounded-md" />
      </div>
      <div className="hub-dapp-skel h-10 w-full rounded-lg" />
    </div>
  );
}

/** Hub Live Markets card — all review fields + Trade → detail. */
export function HubLiveMarketCard({
  market,
  index = 0,
}: {
  market: LiveMarketCardDto;
  index?: number;
}) {
  const router = useRouter();
  const yesPct = Math.round(
    Math.max(0, Math.min(1, market.probability ?? 0.5)) * 100,
  );
  const noPct = 100 - yesPct;
  const ends = endsInLabel(market.closesAt);
  const detailHref = ROUTES.market(market.slug);
  const creator = market.creatorAddress?.trim() || market.creatorDisplayName?.trim() || null;
  const narrative = market.narrative?.trim() || null;
  const participants = Math.max(0, Math.round(market.participants ?? 0));

  const go = (e?: MouseEvent) => {
    e?.stopPropagation();
    router.push(detailHref);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.04 }}
      role="link"
      tabIndex={0}
      onClick={() => go()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
      className="hub-dapp-card hub-dapp-card--interactive cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="hub-dapp-market-title">{market.title}</h3>
        <span
          className={cn(
            "hub-dapp-market-chip shrink-0 tabular-nums",
            ends.urgent &&
              "border-rose-400/30 bg-rose-500/15 text-rose-300",
          )}
        >
          Ends {ends.label}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {narrative ? (
          <span className="hub-dapp-market-chip hub-dapp-market-chip--accent">
            {narrative}
          </span>
        ) : (
          <span className="hub-dapp-market-chip">
            {market.category || "Market"}
          </span>
        )}
        {creator ? (
          <span className="hub-dapp-market-chip font-mono" title={creator}>
            by {shortenCreator(creator)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-end justify-between gap-2">
          <span className="hub-dapp-stat-label">Probability</span>
          <span className="hub-dapp-prob-pill">{yesPct}% YES</span>
        </div>
        <div className="hub-dapp-prob-track" aria-hidden>
          <div
            className="hub-dapp-prob-fill--yes"
            style={{ width: `${yesPct}%` }}
          />
          <div
            className="hub-dapp-prob-fill--no"
            style={{ width: `${noPct}%` }}
          />
        </div>
        <div className="flex justify-between gap-2 text-[11px]">
          <span className="hub-dapp-stat-label !normal-case !tracking-normal">
            YES{" "}
            <span className="hub-dapp-move-up font-semibold tabular-nums">
              {yesPct}%
            </span>
          </span>
          <span className="hub-dapp-stat-label !normal-case !tracking-normal">
            NO{" "}
            <span className="hub-dapp-move-down font-semibold tabular-nums">
              {noPct}%
            </span>
          </span>
        </div>
      </div>

      <div className="hub-dapp-market-stats">
        <div>
          <span className="hub-dapp-stat-label">Volume</span>
          <span className="hub-dapp-stat-value hub-dapp-stat-value--sm mt-1">
            {formatCompactUsd(market.volumeUsd ?? 0)}
          </span>
        </div>
        <div>
          <span className="hub-dapp-stat-label">Liquidity</span>
          <span className="hub-dapp-stat-value hub-dapp-stat-value--sm mt-1">
            {formatCompactUsd(market.liquidityUsd ?? 0)}
          </span>
        </div>
        <div>
          <span className="hub-dapp-stat-label">Traders</span>
          <span className="hub-dapp-stat-value hub-dapp-stat-value--sm mt-1">
            {participants.toLocaleString()}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => go(e)}
        className="hub-dapp-cta hub-dapp-cta--solid mt-4"
      >
        Trade
      </button>
    </motion.article>
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
    retry: 1,
  });

  const markets = useMemo(() => {
    const api = query.data ?? [];
    if (query.isLoading && !query.data) {
      return [] as LiveMarketCardDto[];
    }
    if (api.length > 0) {
      return api.slice(0, 6);
    }
    return getDemoLiveMarkets(tab, 6);
  }, [query.data, query.isLoading, tab]);

  const loading = query.isLoading && !query.data;

  return (
    <section className="hub-section" aria-label="Live Markets">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="hub-section-title">Live Markets</h2>
          <p className="hub-section-sub mt-0.5">
            Active prediction markets on BSC Testnet.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.markets}
            className="text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
          >
            View All →
          </Link>
        </div>
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
                  ? "bg-white/10 font-medium text-[var(--foreground)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="hub-dapp-grid-markets mt-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <LiveMarketSkeleton key={i} />)
          : markets.map((market, index) => (
              <HubLiveMarketCard key={`${tab}-${market.id}`} market={market} index={index} />
            ))}
      </div>
    </section>
  );
}

/** @deprecated Prefer HubLiveMarketCard — kept for accidental imports. */
export { HubLiveMarketCard as LiveMarketCard };
