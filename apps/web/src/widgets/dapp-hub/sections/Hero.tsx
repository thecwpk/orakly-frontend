"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { formatCompactUsd } from "@orakly/utils";
import { apiClient } from "@/api/client/http-client";
import { useOpenTradeModal } from "@/features/trading";
import { cn } from "@/lib/utils";
import { fetchHomeStats } from "@/shared/api/fetchers/hub-home";
import { queryKeys } from "@/shared/api/query-keys";
import { unwrapApiResult } from "@/shared/api/unwrap";
import { ROUTES } from "@/shared/constants/routes";
import type { LiveMarketCardDto } from "@/shared/contracts/live-markets";
import { Sparkline } from "@/shared/ui";
import { HubCountUp } from "../components/hub-count-up";
import { HubProbRing } from "../components/hub-hero-visuals";
import { buildFeaturedSparkSeries } from "../lib/hub-sparkline-series";
import { resolveMarketPulseStats } from "../lib/market-pulse-stats";
import { marketToTradeModal } from "../lib/open-hub-trade";

function clamp0to100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function endsInLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "Ended";
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return `${Math.max(1, totalMin % 60)}m`;
}

function fmtUsd(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

async function fetchTopMarkets(limit = 4): Promise<LiveMarketCardDto[]> {
  const qs = new URLSearchParams({
    status: "OPEN",
    limit: String(limit),
    sort: "trending",
  });
  const res = await apiClient.request<LiveMarketCardDto[]>(
    `/api/v1/markets?${qs.toString()}`,
  );
  return unwrapApiResult(res);
}

function AttentionPulse({
  series,
  current,
}: {
  series: readonly number[];
  current: number | null;
}) {
  return (
    <div className="relative h-[4.5rem] w-full overflow-hidden rounded-[var(--hub-dapp-radius)] border border-[var(--hub-border)] bg-[var(--hub-card)]">
      <div className="relative flex h-full items-center gap-4 px-4">
        <div className="min-w-[3.5rem] shrink-0 border-r border-[var(--hub-border)] pr-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
            Index
          </p>
          <p className="mt-0.5 text-[22px] font-bold tabular-nums leading-none text-[var(--hub-fg)]">
            {current == null ? "—" : Math.round(current)}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <Sparkline
            data={series}
            width={420}
            height={44}
            tone="violet"
            fill
            showLastDot
            intensity="high"
            ariaLabel="Live attention index sparkline"
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}

function MoverChip({
  market,
  index,
}: {
  market: LiveMarketCardDto;
  index: number;
}) {
  const yesPct = Math.round(
    Math.max(0, Math.min(1, market.probability ?? 0.5)) * 100,
  );
  const spark = useMemo(
    () => buildFeaturedSparkSeries(market.id, market.probability ?? 0.5, []),
    [market.id, market.probability],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 + index * 0.06 }}
    >
      <Link
        href={ROUTES.market(market.slug)}
        className="group flex items-center gap-3 rounded-[var(--hub-dapp-radius)] border border-[var(--hub-border)] bg-[var(--hub-card)] p-3 no-underline transition hover:border-[var(--hub-border-strong)] hover:bg-[var(--hub-card-hover)]"
      >
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-[var(--hub-fg)] group-hover:text-[var(--hub-primary-bright)]">
            {market.title}
          </p>
          <p className="mt-1 text-[11px] tabular-nums text-[var(--hub-muted)]">
            <span className="text-[var(--hub-success)]">{yesPct}% YES</span>
            {" · "}
            {formatCompactUsd(market.volumeUsd ?? 0)}
          </p>
        </div>
        <div className="w-[72px] shrink-0">
          <Sparkline
            data={spark}
            width={72}
            height={28}
            tone={yesPct >= 50 ? "emerald" : "rose"}
            fill
            intensity="normal"
            ariaLabel=""
            className="h-7 w-full"
          />
        </div>
      </Link>
    </motion.div>
  );
}

function FeaturedMarketPanel({ market }: { market: LiveMarketCardDto }) {
  const openTrade = useOpenTradeModal();
  const probability = Math.max(0, Math.min(1, market.probability ?? 0.5));
  const yesPct = Math.round(probability * 100);
  const noPct = 100 - yesPct;
  const isOpen = market.status === "OPEN";
  const canTrade = Boolean(market.onChainAddress?.trim()) && isOpen;

  const spark = useMemo(
    () => buildFeaturedSparkSeries(market.id, probability, []),
    [market.id, probability],
  );

  const handleSide = (side: "YES" | "NO", e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canTrade) {
      window.location.assign(ROUTES.market(market.slug));
      return;
    }
    openTrade(marketToTradeModal(market), side);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className="relative overflow-hidden rounded-[1rem] border border-[var(--hub-border)] bg-[var(--hub-card)] p-4 sm:p-5"
    >
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--hub-muted)]">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--hub-success)]/70" />
              <span className="relative size-1.5 rounded-full bg-[var(--hub-success)]" />
            </span>
            Featured
          </span>
          {market.narrative ? (
            <span className="hub-dapp-market-chip hub-dapp-market-chip--accent">
              {market.narrative}
            </span>
          ) : (
            <span className="hub-dapp-market-chip">
              {market.category || "Market"}
            </span>
          )}
        </div>
        <span className="text-[11px] tabular-nums text-[var(--hub-muted)]">
          Ends {endsInLabel(market.closesAt)}
        </span>
      </div>

      <div className="relative mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
        <HubProbRing yesPct={yesPct} size={148} />

        <div className="min-w-0 flex-1 self-stretch">
          <Link
            href={ROUTES.market(market.slug)}
            className="block text-balance text-[18px] font-semibold leading-snug tracking-tight text-[var(--hub-fg)] transition hover:text-[var(--hub-primary-bright)] sm:text-[20px]"
          >
            {market.title}
          </Link>

          <div className="mt-3 overflow-hidden rounded-lg border border-[var(--hub-glass-border)] bg-[var(--hub-track-bg)] px-2 py-1.5">
            <Sparkline
              data={spark}
              width={360}
              height={44}
              tone="violet"
              fill
              showLastDot
              intensity="high"
              ariaLabel={`${market.title} probability sparkline`}
              className="h-11 w-full"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <p className="hub-dapp-stat-label">Volume</p>
              <p className="hub-dapp-stat-value hub-dapp-stat-value--sm mt-0.5">
                {formatCompactUsd(market.volumeUsd ?? 0)}
              </p>
            </div>
            <div>
              <p className="hub-dapp-stat-label">Liquidity</p>
              <p className="hub-dapp-stat-value hub-dapp-stat-value--sm mt-0.5">
                {formatCompactUsd(market.liquidityUsd ?? 0)}
              </p>
            </div>
            <div>
              <p className="hub-dapp-stat-label">Traders</p>
              <p className="hub-dapp-stat-value hub-dapp-stat-value--sm mt-0.5">
                {Math.max(0, Math.round(market.participants ?? 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex gap-2">
        <button
          type="button"
          onClick={(e) => handleSide("YES", e)}
          className="hub-yes-btn min-h-14 text-sm"
        >
          YES {yesPct}%
        </button>
        <button
          type="button"
          onClick={(e) => handleSide("NO", e)}
          className="hub-no-btn min-h-14 text-sm"
        >
          NO {noPct}%
        </button>
      </div>
    </motion.article>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="rounded-[1rem] border border-[var(--hub-border)] bg-[var(--hub-card)] p-5">
      <div className="hub-dapp-skel mb-4 h-5 w-28 rounded-full" />
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="hub-dapp-skel size-[148px] shrink-0 rounded-full" />
        <div className="w-full flex-1 space-y-3">
          <div className="hub-dapp-skel h-5 w-[92%]" />
          <div className="hub-dapp-skel h-5 w-[70%]" />
          <div className="hub-dapp-skel h-11 w-full rounded-lg" />
          <div className="grid grid-cols-3 gap-2">
            <div className="hub-dapp-skel h-10 rounded-md" />
            <div className="hub-dapp-skel h-10 rounded-md" />
            <div className="hub-dapp-skel h-10 rounded-md" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="hub-dapp-skel h-14 flex-1 rounded-lg" />
        <div className="hub-dapp-skel h-14 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Hub hero — clean trading desk open (first impression).
 * Live KPIs + featured market + attention pulse. No decorative backdrop.
 */
export function Hero() {
  const SERIES_LEN = 28;
  const seed = 64;

  const statsQ = useQuery({
    queryKey: ["hub", "homeStats", "heroPulse"],
    queryFn: fetchHomeStats,
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: 1,
  });

  const marketsQ = useQuery({
    queryKey: queryKeys.hub.liveMarkets("trending", 4),
    queryFn: () => fetchTopMarkets(4),
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: 1,
  });

  const pulse = resolveMarketPulseStats(statsQ.data, {
    apiError: statsQ.isError,
  });

  const markets = useMemo(() => {
    const api = marketsQ.data ?? [];
    return api.slice(0, 4);
  }, [marketsQ.data]);

  const featured = markets[0] ?? null;
  const movers = markets.slice(1, 4);

  const initialSeries = useMemo(() => {
    return Array.from({ length: SERIES_LEN }, (_, i) => {
      const t = i / Math.max(1, SERIES_LEN - 1);
      const wave = Math.sin(t * Math.PI * 2) * 3;
      const wave2 = Math.cos(t * Math.PI * 5) * 1.75;
      return clamp0to100(seed + wave - wave2);
    });
  }, []);

  const [series, setSeries] = useState<readonly number[]>(initialSeries);
  const attentionIndex = statsQ.data?.attentionIndex;
  const clampedAttentionIndex =
    attentionIndex == null ? null : clamp0to100(attentionIndex);

  useEffect(() => {
    if (clampedAttentionIndex == null) return;
    setSeries((prev) => {
      const next = prev.slice(1);
      next.push(clampedAttentionIndex);
      return next;
    });
  }, [clampedAttentionIndex]);

  const loadingMarkets = marketsQ.isLoading && !marketsQ.data && !featured;

  return (
    <section
      aria-label="Trading desk"
      className="relative border-b border-[var(--hub-border)] pb-9 pt-5 sm:pb-11 sm:pt-7 lg:pb-12 lg:pt-8"
    >
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="min-w-0 max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--hub-muted)]">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-[var(--hub-success)]/60" />
                <span className="relative size-1.5 rounded-full bg-[var(--hub-success)]" />
              </span>
              Live desk
              <span className="text-[var(--hub-border-strong)]">·</span>
              {pulse.topChain}
            </div>
            <h1
              className="text-[2rem] font-extrabold leading-[1.05] tracking-tight text-[var(--hub-fg)] sm:text-[2.35rem]"
              style={{
                fontFamily: "var(--font-display), var(--font-sans), system-ui",
              }}
            >
              Attention Terminal
            </h1>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--hub-muted)]">
              {pulse.currentMeta}
              <span className="mx-1.5 text-[var(--hub-border-strong)]">·</span>
              {pulse.marketSentiment}
            </p>
          </div>

          <motion.dl
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-[var(--hub-dapp-radius)] border border-[var(--hub-border)] bg-[var(--hub-border)] sm:grid-cols-4 lg:w-auto lg:min-w-[28rem]"
          >
            {(
              [
                {
                  label: "Index",
                  value: <HubCountUp value={pulse.attentionIndex} />,
                  tone: "text-[var(--hub-primary-bright)]",
                },
                {
                  label: "24h Vol",
                  value: (
                    <HubCountUp value={pulse.volume24hUsd} formatter={fmtUsd} />
                  ),
                  tone: "text-[var(--hub-success)]",
                },
                {
                  label: "Markets",
                  value: <HubCountUp value={pulse.liveMarkets} />,
                  tone: "text-[var(--hub-fg)]",
                },
                {
                  label: "Traders",
                  value: <HubCountUp value={pulse.activeTraders} />,
                  tone: "text-[var(--hub-fg)]",
                },
              ] as const
            ).map((stat) => (
              <div
                key={stat.label}
                className="bg-[var(--hub-card)] px-3.5 py-3 sm:min-w-[6.75rem]"
              >
                <dt className="hub-dapp-stat-label">{stat.label}</dt>
                <dd
                  className={cn(
                    "mt-1 text-[1.125rem] font-bold tabular-nums leading-none",
                    stat.tone,
                  )}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <AttentionPulse series={series} current={clampedAttentionIndex} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.8fr)] lg:items-start lg:gap-5">
          {loadingMarkets ? (
            <FeaturedSkeleton />
          ) : featured ? (
            <FeaturedMarketPanel market={featured} />
          ) : (
            <div className="rounded-[1rem] border border-[var(--hub-border)] bg-[var(--hub-card)] p-8 text-center text-sm text-[var(--hub-muted)]">
              No open markets yet.
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
                Top movers
              </p>
              <Link
                href={ROUTES.markets}
                className={cn(
                  "text-[11px] font-medium text-[var(--hub-primary-bright)]",
                  "transition hover:text-[var(--hub-primary)]",
                )}
              >
                All markets →
              </Link>
            </div>
            {loadingMarkets
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[4.25rem] rounded-[var(--hub-dapp-radius)] border border-[var(--hub-border)] bg-[var(--hub-card)] p-3"
                  >
                    <div className="hub-dapp-skel h-3 w-[80%]" />
                    <div className="hub-dapp-skel mt-2 h-3 w-[40%]" />
                  </div>
                ))
              : movers.map((m, i) => (
                  <MoverChip key={m.id} market={m} index={i} />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
