"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCompactUsd } from "@orakly/utils";
import { apiClient } from "@/api/client/http-client";
import { useOpenTradeModal } from "@/features/trading";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { queryKeys } from "@/shared/api/query-keys";
import { unwrapApiResult } from "@/shared/api/unwrap";
import { Sparkline } from "@/shared/ui";
import type { LiveMarketCardDto } from "@/shared/contracts/live-markets";
import { buildFeaturedSparkSeries } from "../lib/hub-sparkline-series";
import { marketToTradeModal } from "../lib/open-hub-trade";

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
    <div className="hub-dapp-skel-card hub-glass-card">
      <div className="hub-dapp-skel mb-3 h-4 w-[92%]" />
      <div className="hub-dapp-skel mb-3 h-4 w-[58%]" />
      <div className="mb-3 flex gap-2">
        <div className="hub-dapp-skel h-5 w-16 rounded-md" />
        <div className="hub-dapp-skel h-5 w-20 rounded-md" />
      </div>
      <div className="hub-dapp-skel mb-4 h-10 w-full rounded-md" />
      <div className="hub-dapp-skel mb-2 h-2.5 w-20" />
      <div className="hub-dapp-skel mb-4 h-2 w-full rounded-full" />
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="hub-dapp-skel h-10 rounded-md" />
        <div className="hub-dapp-skel h-10 rounded-md" />
        <div className="hub-dapp-skel h-10 rounded-md" />
      </div>
      <div className="flex gap-2">
        <div className="hub-dapp-skel h-11 flex-1 rounded-lg" />
        <div className="hub-dapp-skel h-11 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

/** Hub Live Markets card — glass chrome, sparkline, YES/NO trade actions. */
export function HubLiveMarketCard({
  market,
  index = 0,
}: {
  market: LiveMarketCardDto;
  index?: number;
}) {
  const router = useRouter();
  const openTrade = useOpenTradeModal();
  const probability = Math.max(0, Math.min(1, market.probability ?? 0.5));
  const yesPct = Math.round(probability * 100);
  const noPct = 100 - yesPct;
  const ends = endsInLabel(market.closesAt);
  const detailHref = ROUTES.market(market.slug);
  const creator =
    market.creatorAddress?.trim() || market.creatorDisplayName?.trim() || null;
  const narrative = market.narrative?.trim() || null;
  const participants = Math.max(0, Math.round(market.participants ?? 0));
  const isOpen = market.status === "OPEN" && ends.label !== "Ended";
  const canTrade = Boolean(market.onChainAddress?.trim()) && isOpen;

  const sparkSeries = useMemo(
    () =>
      buildFeaturedSparkSeries(market.id, probability, []),
    [market.id, probability],
  );

  const go = (e?: MouseEvent) => {
    e?.stopPropagation();
    router.push(detailHref);
  };

  const handleSide = (side: "YES" | "NO", e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canTrade) {
      go(e);
      return;
    }
    openTrade(marketToTradeModal(market), side);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      role="link"
      tabIndex={0}
      onClick={() => go()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
      className="hub-dapp-card hub-dapp-card--interactive hub-glass-card hub-glass-card--lift cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="hub-dapp-market-title">{market.title}</h3>
        <span
          className={cn(
            "hub-dapp-market-chip shrink-0 tabular-nums",
            ends.urgent &&
              "border-[var(--hub-danger)]/30 bg-[var(--hub-danger-bg)] text-[var(--hub-danger)]",
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

      <div className="mt-3 overflow-hidden rounded-lg border border-[var(--hub-glass-border)] bg-[var(--hub-track-bg)] px-2 py-1.5">
        <Sparkline
          data={sparkSeries}
          width={320}
          height={36}
          tone="emerald"
          fill
          showLastDot
          intensity="normal"
          ariaLabel={`${market.title} probability sparkline`}
          className="h-9 w-full"
        />
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

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={(e) => handleSide("YES", e)}
          className="hub-yes-btn"
        >
          YES {yesPct}%
        </button>
        <button
          type="button"
          onClick={(e) => handleSide("NO", e)}
          className="hub-no-btn"
        >
          NO {noPct}%
        </button>
      </div>
    </motion.article>
  );
}

/**
 * Section 3 — Live Markets: tabbed tradable market cards.
 */
export function LiveMarkets() {
  const [tab, setTab] = useState<LiveTab>("trending");

  const query = useQuery({
    queryKey: queryKeys.hub.liveMarkets(tab, 20),
    queryFn: () => fetchLiveMarkets(tab, 20),
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: 1,
  });

  const markets = useMemo(() => {
    return (query.data ?? []).slice(0, 20);
  }, [query.data]);

  const loading = query.isLoading && !query.data;

  return (
    <section className="hub-section hub-section-enter" aria-label="Live Markets">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="hub-section-title">Live Markets</h2>
          <p className="hub-section-sub mt-0.5">
            Active prediction markets on BNB Chain.
          </p>
        </div>
        <Link
          href={ROUTES.markets}
          className="text-sm font-medium text-[var(--hub-primary-bright)] transition hover:text-[var(--hub-primary)]"
        >
          View All →
        </Link>
      </div>

      <div
        className="flex w-fit gap-1 rounded-xl border border-[var(--hub-glass-border)] bg-[color-mix(in_srgb,var(--hub-fg)_4%,transparent)] p-1 backdrop-blur-sm"
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
                "min-h-[2.5rem] rounded-lg px-4 py-1.5 text-sm transition-all",
                active
                  ? "bg-[var(--hub-primary-soft)] font-medium text-[var(--hub-fg)] shadow-[0_0_12px_rgba(124,92,252,0.2)]"
                  : "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="hub-dapp-grid-markets mt-4 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:gap-3 max-sm:overflow-x-auto max-sm:pb-2">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <LiveMarketSkeleton key={i} />
            ))
          : markets.length === 0
            ? (
                <p className="col-span-full py-10 text-center text-sm text-[var(--hub-muted)]">
                  No live markets yet. Check back shortly.
                </p>
              )
            : markets.map((market, index) => (
              <div
                key={`${tab}-${market.id}`}
                className="max-sm:min-w-[min(88vw,320px)] max-sm:snap-start"
              >
                <HubLiveMarketCard market={market} index={index} />
              </div>
            ))}
      </div>
    </section>
  );
}

/** @deprecated Prefer HubLiveMarketCard — kept for accidental imports. */
export { HubLiveMarketCard as LiveMarketCard };
