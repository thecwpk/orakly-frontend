"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

/** Slim attention tape — sits under the brand row, not a competing card. */
function AttentionPulse({
  series,
  current,
}: {
  series: readonly number[];
  current: number | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--hub-glass-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--hub-card)_96%,transparent),color-mix(in_srgb,var(--hub-bg-subtle)_88%,transparent))] shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
      <div
        className="pointer-events-none absolute inset-y-0 left-[6.5rem] w-px bg-[color-mix(in_srgb,var(--hub-border)_82%,transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--hub-border) 34%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--hub-border) 28%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 100%, 100% 100%",
        }}
      />

      <div className="relative grid min-h-[4.75rem] grid-cols-[6.5rem_minmax(0,1fr)] items-stretch sm:min-h-[5.5rem]">
        <div className="flex flex-col justify-center px-4 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
            Index
          </p>
          <p className="mt-1 text-[1.7rem] font-extrabold tabular-nums leading-none text-[var(--hub-fg)] sm:text-[1.95rem]">
            {current == null ? "—" : Math.round(current)}
          </p>
        </div>

        <div className="relative min-w-0 px-3 py-3 sm:px-4">
          <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-[var(--hub-muted)]">
            <span>Attention curve</span>
            <span className="rounded-full border border-[var(--hub-glass-border)] bg-[color-mix(in_srgb,var(--hub-primary)_8%,transparent)] px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--hub-primary-bright)]">
              Live
            </span>
          </div>
          <div className="relative h-10 rounded-xl bg-[linear-gradient(180deg,color-mix(in_srgb,var(--hub-primary)_8%,transparent),transparent)] sm:h-12">
            <Sparkline
              data={series}
              width={560}
              height={48}
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
    </div>
  );
}

function MoverChip({
  market,
  index,
  active = false,
  onSelect,
}: {
  market: LiveMarketCardDto;
  index: number;
  active?: boolean;
  onSelect?: () => void;
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
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "group flex items-center gap-3 rounded-[var(--hub-dapp-radius)] border bg-[var(--hub-card)] px-3 py-2.5 text-left no-underline transition",
          active
            ? "border-[var(--hub-primary-bright)] bg-[color-mix(in_srgb,var(--hub-primary)_10%,var(--hub-card))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--hub-primary)_28%,transparent)]"
            : "border-[var(--hub-border)] hover:border-[var(--hub-border-strong)] hover:bg-[var(--hub-card-hover)]",
        )}
        aria-pressed={active}
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
        <div className="w-[64px] shrink-0 sm:w-[72px]">
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
      </button>
    </motion.div>
  );
}

function FeaturedMarketPanel({
  market,
  activeIndex,
  total,
  onPrev,
  onNext,
  onJump,
}: {
  market: LiveMarketCardDto;
  activeIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
}) {
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
      className="relative overflow-hidden rounded-[1.5rem] border border-[var(--hub-glass-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--hub-card)_96%,transparent),color-mix(in_srgb,var(--hub-bg-subtle)_90%,transparent))] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.1)] sm:p-5"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(124,92,252,0.16),transparent_62%)]"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hub-glass-border)] bg-[color-mix(in_srgb,var(--hub-fg)_4%,transparent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--hub-muted)]">
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
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-[var(--hub-muted)]">
            {(() => {
              const label = endsInLabel(market.closesAt);
              return label === "Ended" ? "Ended" : `Ends ${label}`;
            })()}
          </span>
          <span className="rounded-full border border-[var(--hub-glass-border)] bg-[color-mix(in_srgb,var(--hub-fg)_4%,transparent)] px-2.5 py-1 text-[10px] font-semibold tabular-nums text-[var(--hub-muted)]">
            {String(activeIndex + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="relative mt-4 grid gap-4 lg:grid-cols-[172px_minmax(0,1fr)] lg:items-start lg:gap-5">
        <div className="rounded-[1.2rem] border border-[var(--hub-glass-border)] bg-[color-mix(in_srgb,var(--hub-fg)_4%,transparent)] p-3.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
            Market pricing
          </p>
          <div className="mt-3 space-y-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-success)]">
                  Yes
                </span>
                <span className="text-[1.35rem] font-extrabold tabular-nums text-[var(--hub-success)]">
                  {yesPct}%
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/8 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-danger)]">
                  No
                </span>
                <span className="text-[1.35rem] font-extrabold tabular-nums text-[var(--hub-danger)]">
                  {noPct}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[var(--hub-glass-border)] bg-[color-mix(in_srgb,var(--hub-bg)_55%,transparent)] px-3 py-3">
            <div className="flex items-center justify-between text-[10px] text-[var(--hub-muted)]">
              <span>Spread</span>
              <span className="font-medium text-[var(--hub-fg)]">Balanced</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--hub-track-bg)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--hub-success),var(--hub-primary-bright))]"
                style={{ width: `${yesPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 self-stretch">
          <Link
            href={ROUTES.market(market.slug)}
            className="block text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-tight text-[var(--hub-fg)] transition hover:text-[var(--hub-primary-bright)] sm:text-[1.85rem]"
          >
            {market.title}
          </Link>

          <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[var(--hub-glass-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--hub-primary)_8%,transparent),transparent)] px-4 py-4">
            <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--hub-muted)]">
              <span>Price action</span>
              <span className="text-[var(--hub-primary-bright)]">Featured market</span>
            </div>
            <div
              className="pointer-events-none mb-1 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--hub-border)_85%,transparent),transparent)]"
              aria-hidden
            />
            <div className="relative h-[8.5rem] sm:h-[9.75rem]">
              <div
                className="pointer-events-none absolute inset-0 opacity-65"
                aria-hidden
                style={{
                  backgroundImage:
                    "linear-gradient(to right, color-mix(in srgb, var(--hub-border) 28%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--hub-border) 24%, transparent) 1px, transparent 1px)",
                  backgroundSize: "64px 100%, 100% 32px",
                }}
              />
              <Sparkline
                data={spark}
                width={720}
                height={156}
                tone="violet"
                fill
                showLastDot
                intensity="high"
                ariaLabel={`${market.title} probability sparkline`}
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 rounded-[1rem] border border-[var(--hub-glass-border)] bg-[color-mix(in_srgb,var(--hub-fg)_2%,transparent)] p-3 sm:p-4">
            <div className="border-r border-[color-mix(in_srgb,var(--hub-border)_75%,transparent)] pr-2 last:border-r-0">
              <p className="hub-dapp-stat-label">Volume</p>
              <p className="hub-dapp-stat-value mt-0.5 text-[1.05rem]">
                {formatCompactUsd(market.volumeUsd ?? 0)}
              </p>
            </div>
            <div className="border-r border-[color-mix(in_srgb,var(--hub-border)_75%,transparent)] px-2 last:border-r-0">
              <p className="hub-dapp-stat-label">Liquidity</p>
              <p className="hub-dapp-stat-value mt-0.5 text-[1.05rem]">
                {formatCompactUsd(market.liquidityUsd ?? 0)}
              </p>
            </div>
            <div className="pl-2">
              <p className="hub-dapp-stat-label">Traders</p>
              <p className="hub-dapp-stat-value mt-0.5 text-[1.05rem]">
                {Math.max(0, Math.round(market.participants ?? 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={(e) => handleSide("YES", e)}
          className="hub-yes-btn min-h-12 rounded-2xl text-sm sm:min-h-14"
        >
          YES {yesPct}%
        </button>
        <button
          type="button"
          onClick={(e) => handleSide("NO", e)}
          className="hub-no-btn min-h-12 rounded-2xl text-sm sm:min-h-14"
        >
          NO {noPct}%
        </button>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-[var(--hub-glass-border)] pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--hub-glass-border)] bg-[color-mix(in_srgb,var(--hub-fg)_4%,transparent)] text-[var(--hub-fg)] transition hover:border-[var(--hub-border-strong)] hover:bg-[var(--hub-card-hover)]"
            aria-label="Previous featured market"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--hub-glass-border)] bg-[color-mix(in_srgb,var(--hub-fg)_4%,transparent)] text-[var(--hub-fg)] transition hover:border-[var(--hub-border-strong)] hover:bg-[var(--hub-card-hover)]"
            aria-label="Next featured market"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-pressed={i === activeIndex}
              className={cn(
                "h-2.5 rounded-full transition-all",
                i === activeIndex
                  ? "w-7 bg-[var(--hub-primary-bright)]"
                  : "w-2.5 bg-[color-mix(in_srgb,var(--hub-border)_85%,transparent)] hover:bg-[var(--hub-border-strong)]",
              )}
            />
          ))}
        </div>

        <Link
          href={ROUTES.markets}
          className="text-[11px] font-medium text-[var(--hub-primary-bright)] transition hover:text-[var(--hub-primary)]"
        >
          Explore all →
        </Link>
      </div>
    </motion.article>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="rounded-[1rem] border border-[var(--hub-border)] bg-[var(--hub-card)] p-5">
      <div className="hub-dapp-skel mb-4 h-5 w-28 rounded-full" />
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="w-full shrink-0 rounded-[1rem] border border-[var(--hub-border)] p-3 sm:w-[172px]">
          <div className="hub-dapp-skel h-3 w-20" />
          <div className="mt-3 space-y-2">
            <div className="hub-dapp-skel h-14 rounded-2xl" />
            <div className="hub-dapp-skel h-14 rounded-2xl" />
          </div>
          <div className="hub-dapp-skel mt-3 h-10 rounded-xl" />
        </div>
        <div className="w-full flex-1 space-y-3">
          <div className="hub-dapp-skel h-5 w-[92%]" />
          <div className="hub-dapp-skel h-5 w-[70%]" />
          <div className="hub-dapp-skel h-40 w-full rounded-[1.25rem]" />
          <div className="grid grid-cols-3 gap-2">
            <div className="hub-dapp-skel h-14 rounded-[1rem]" />
            <div className="hub-dapp-skel h-14 rounded-[1rem]" />
            <div className="hub-dapp-skel h-14 rounded-[1rem]" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="hub-dapp-skel h-12 flex-1 rounded-lg sm:h-14" />
        <div className="hub-dapp-skel h-12 flex-1 rounded-lg sm:h-14" />
      </div>
    </div>
  );
}

/**
 * Hub hero — first impression: brand, slim attention tape, featured market + movers.
 * Platform KPIs live once in Market Pulse (no duplicate stat wall).
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

  const [activeIndex, setActiveIndex] = useState(0);
  const featured = markets[activeIndex] ?? markets[0] ?? null;

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

  useEffect(() => {
    if (markets.length === 0) return;
    setActiveIndex((prev) => Math.min(prev, markets.length - 1));
  }, [markets.length]);

  useEffect(() => {
    if (markets.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % markets.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [markets.length]);

  const loadingMarkets = marketsQ.isLoading && !marketsQ.data && !featured;
  const cycleTo = (next: number) => {
    if (markets.length === 0) return;
    const normalized = ((next % markets.length) + markets.length) % markets.length;
    setActiveIndex(normalized);
  };

  return (
    <section
      aria-label="Trading desk"
      className="relative border-b border-[var(--hub-border)] pb-5 pt-4 sm:pb-6 sm:pt-5 lg:pb-7 lg:pt-6"
    >
      <div className="space-y-4 lg:space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 max-w-2xl"
        >
          <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--hub-muted)]">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--hub-success)]/60" />
              <span className="relative size-1.5 rounded-full bg-[var(--hub-success)]" />
            </span>
            Live desk
            <span className="text-[var(--hub-border-strong)]">·</span>
            {pulse.topChain}
          </div>
          <h1
            className="text-[1.85rem] font-extrabold leading-[1.05] tracking-tight text-[var(--hub-fg)] sm:text-[2.2rem]"
            style={{
              fontFamily: "var(--font-display), var(--font-sans), system-ui",
            }}
          >
            Attention Terminal
          </h1>
          <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-[var(--hub-muted)] sm:text-[14px]">
            {pulse.currentMeta}
            <span className="mx-1.5 text-[var(--hub-border-strong)]">·</span>
            {pulse.marketSentiment}
          </p>
        </motion.div>

        <AttentionPulse series={series} current={clampedAttentionIndex} />

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)] lg:items-start lg:gap-4">
          {loadingMarkets ? (
            <FeaturedSkeleton />
          ) : featured ? (
            <FeaturedMarketPanel
              market={featured}
              activeIndex={activeIndex}
              total={markets.length}
              onPrev={() => cycleTo(activeIndex - 1)}
              onNext={() => cycleTo(activeIndex + 1)}
              onJump={cycleTo}
            />
          ) : (
            <div className="rounded-[1rem] border border-[var(--hub-border)] bg-[var(--hub-card)] p-8 text-center text-sm text-[var(--hub-muted)]">
              No open markets yet.
            </div>
          )}

          <div className="flex flex-col gap-2">
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
                    className="h-[3.75rem] rounded-[var(--hub-dapp-radius)] border border-[var(--hub-border)] bg-[var(--hub-card)] p-3"
                  >
                    <div className="hub-dapp-skel h-3 w-[80%]" />
                    <div className="hub-dapp-skel mt-2 h-3 w-[40%]" />
                  </div>
                ))
              : markets.map((m, i) => (
                  <MoverChip
                    key={m.id}
                    market={m}
                    index={i}
                    active={i === activeIndex}
                    onSelect={() => setActiveIndex(i)}
                  />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
