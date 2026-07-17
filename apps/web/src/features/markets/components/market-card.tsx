"use client";

import type { Market } from "@orakly/types";
import { formatCompactUsd } from "@orakly/utils";
import { useRouter } from "next/navigation";
import {
  Bot,
  ChartNoAxesColumnIncreasing,
  Coins,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useOpenTradeModal } from "@/features/trading";
import { WatchlistStar } from "@/features/watchlist";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: string) => UUID_RE.test(v);

function resolveTradeMarketId(m: Market): string | null {
  if (m.backendMarketId) return m.backendMarketId;
  if (isUuid(m.id)) return m.id;
  return null;
}

export type MarketCardVariant = "default" | "compact" | "featured";
export type MarketCardAccent = "cyan" | "violet" | "emerald" | "rose" | "amber";
export type MarketCardChrome = "neon" | "subtle";

export type MarketCardProps = {
  market: Market;
  variant?: MarketCardVariant;
  accent?: MarketCardAccent;
  chrome?: MarketCardChrome;
  isLive?: boolean;
  lastTradeAt?: number | null;
  index?: number;
  volumeMax?: number;
  hideWatchlist?: boolean;
  /** @deprecated Kept for call-site compat — new design is always Polymarket-style. */
  directoryStyle?: boolean;
  href?: string;
  className?: string;
  /** Narrative tag when enriched from live feed. */
  narrative?: string | null;
  /** Trader / participant count when enriched. */
  participants?: number | null;
};

type CategoryVisual = {
  icon: LucideIcon;
  label: string;
  gradient: string;
};

function categoryVisual(category: string): CategoryVisual {
  const c = (category || "").toLowerCase();
  if (c.includes("meme")) {
    return {
      icon: Coins,
      label: formatCategoryLabel(category) || "Meme",
      gradient: "from-purple-900/60 to-pink-900/60",
    };
  }
  if (c.includes("defi")) {
    return {
      icon: Coins,
      label: formatCategoryLabel(category) || "DeFi",
      gradient: "from-blue-900/60 to-cyan-900/60",
    };
  }
  if (/\bai\b/.test(c) || c.includes("artificial")) {
    return {
      icon: Bot,
      label: formatCategoryLabel(category) || "AI",
      gradient: "from-teal-900/60 to-green-900/60",
    };
  }
  if (
    c.includes("layer") ||
    c.includes("l1") ||
    c.includes("chain") ||
    c.includes("solana") ||
    c.includes("base") ||
    c.includes("ethereum")
  ) {
    return {
      icon: Link2,
      label: formatCategoryLabel(category) || "Layer1",
      gradient: "from-orange-900/60 to-amber-900/60",
    };
  }
  return {
    icon: ChartNoAxesColumnIncreasing,
    label: formatCategoryLabel(category) || "Market",
    gradient: "from-indigo-900/60 to-slate-900/60",
  };
}

function formatCategoryLabel(slug: string): string {
  if (!slug || slug === "all") return "";
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeRemaining(iso: string): {
  label: string;
  urgent: boolean;
  expired: boolean;
} {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || Number.isNaN(ms)) {
    return { label: "Closed", urgent: false, expired: true };
  }
  if (ms <= 0) return { label: "ENDED", urgent: true, expired: true };
  const urgent = ms < 24 * 60 * 60 * 1000;
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  let label: string;
  if (days > 0) label = `${days}d ${hours}h`;
  else if (hours > 0) label = `${hours}h ${mins}m`;
  else label = `${Math.max(1, mins)}m`;
  return { label, urgent, expired: false };
}

function useFreshNow(intervalMs = 60_000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}

function MarketCardImpl({
  market,
  isLive = false,
  hideWatchlist = false,
  href,
  className,
  narrative: narrativeProp,
  participants: participantsProp,
}: MarketCardProps) {
  useFreshNow();
  const router = useRouter();

  const probability = market.probability ?? 0.5;
  const yesPct = Math.round(Math.max(0, Math.min(1, probability)) * 100);
  const noPct = 100 - yesPct;
  const volumeUsd = market.volumeUsd ?? 0;
  const liquidityUsd = market.liquidityUsd ?? 0;
  const creatorAddress = market.creatorAddress?.trim() || null;
  const narrative =
    narrativeProp?.trim() ||
    (typeof (market as Market & { narrative?: string | null }).narrative === "string"
      ? (market as Market & { narrative?: string | null }).narrative?.trim()
      : null) ||
    null;
  const participants =
    participantsProp ??
    (typeof (market as Market & { participants?: number }).participants === "number"
      ? (market as Market & { participants?: number }).participants
      : null);

  const visual = useMemo(() => categoryVisual(market.category), [market.category]);
  const CategoryIcon = visual.icon;
  const remaining = useMemo(() => timeRemaining(market.closesAt), [market.closesAt]);
  const isOpen = market.status === "OPEN" && !remaining.expired;
  const showLive = isLive || isOpen;
  const detailsHref = href ?? ROUTES.market(market.slug);
  const deployed = Boolean(market.onChainAddress?.trim());
  const canTrade = deployed && isOpen;

  const openTradeModal = useOpenTradeModal();
  const tradeMarketId = useMemo(() => resolveTradeMarketId(market), [market]);

  const handleSideClick = useCallback(
    (side: "YES" | "NO", e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!canTrade) return;
      openTradeModal(
        {
          tradeMarketId,
          onChainAddress: market.onChainAddress ?? null,
          chainId: market.chainId ?? null,
          slug: market.slug,
          title: market.title,
          category: market.category,
          midYes: probability,
          status: market.status,
          closesAt: market.closesAt,
        },
        side,
      );
    },
    [
      canTrade,
      openTradeModal,
      tradeMarketId,
      market.onChainAddress,
      market.chainId,
      market.slug,
      market.title,
      market.category,
      market.status,
      market.closesAt,
      probability,
    ],
  );

  const goToMarket = useCallback(() => {
    router.push(detailsHref);
  }, [router, detailsHref]);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={goToMarket}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToMarket();
        }
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl",
        "border border-[var(--border)] bg-[var(--background-card)]",
        "transition-all duration-200",
        "hover:border-[var(--border-strong)] hover:shadow-lg hover:shadow-black/20",
        className,
      )}
    >
      {/* Banner */}
      <div
        className={cn(
          "relative flex h-20 flex-col items-center justify-center bg-gradient-to-br",
          visual.gradient,
        )}
      >
        <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-xs tabular-nums">
          <span className={remaining.urgent ? "text-red-400" : "text-white/70"}>
            {remaining.label}
          </span>
        </span>

        {showLive && !remaining.expired ? (
          <span className="absolute right-10 top-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        ) : null}

        {!hideWatchlist ? (
          <WatchlistStar
            id={market.id}
            size="md"
            absolute
            className="!right-2 !top-2 !bg-transparent !text-slate-500 !ring-0 hover:!bg-transparent hover:!text-yellow-400"
          />
        ) : null}

        <CategoryIcon className="size-8 text-white/80" aria-hidden />
        <span className="mt-1 text-xs text-white/60">{visual.label}</span>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-white">{market.title}</h3>

        {(narrative || creatorAddress) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {narrative ? (
              <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                {narrative}
              </span>
            ) : null}
            {creatorAddress ? (
              <span
                className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400"
                title={creatorAddress}
              >
                by {shortenAddress(creatorAddress)}
              </span>
            ) : null}
          </div>
        )}

        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--color-yes)]">YES</span>
            <span className="font-bold tabular-nums text-[var(--color-yes)]">{yesPct}%</span>
          </div>
          <div className="my-1 flex h-1.5 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full bg-[var(--color-yes)] transition-[width] duration-300"
              style={{ width: `${yesPct}%` }}
            />
            <div
              className="h-full bg-[var(--color-no)] transition-[width] duration-300"
              style={{ width: `${noPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--color-no)]">NO</span>
            <span className="font-bold tabular-nums text-[var(--color-no)]">{noPct}%</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span>
            Vol <span className="text-slate-400">{formatCompactUsd(volumeUsd)}</span>
          </span>
          <span>
            Liq <span className="text-slate-400">{formatCompactUsd(liquidityUsd)}</span>
          </span>
          <span>
            {participants != null && Number.isFinite(participants)
              ? `${Math.max(0, Math.round(participants)).toLocaleString()} traders`
              : "No trader data"}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!canTrade}
            title={!deployed ? "Market not yet deployed" : "Buy YES"}
            onClick={(e) => handleSideClick("YES", e)}
            className={cn(
              "rounded-lg border border-green-900/40 bg-[var(--color-yes-bg)] py-2 text-sm font-medium text-[var(--color-yes)]",
              canTrade
                ? "hover:bg-green-900/60"
                : "cursor-not-allowed opacity-40 hover:bg-[var(--color-yes-bg)]",
            )}
          >
            YES
          </button>
          <button
            type="button"
            disabled={!canTrade}
            title={!deployed ? "Market not yet deployed" : "Buy NO"}
            onClick={(e) => handleSideClick("NO", e)}
            className={cn(
              "rounded-lg border border-red-900/40 bg-[var(--color-no-bg)] py-2 text-sm font-medium text-[var(--color-no)]",
              canTrade
                ? "hover:bg-red-900/60"
                : "cursor-not-allowed opacity-40 hover:bg-[var(--color-no-bg)]",
            )}
          >
            NO
          </button>
        </div>
      </div>
    </article>
  );
}

export const MarketCard = memo(MarketCardImpl);
