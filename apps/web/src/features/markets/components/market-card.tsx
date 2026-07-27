"use client";

import type { Market } from "@orakly/types";
import { formatCompactUsd } from "@orakly/utils";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useOpenTradeModal } from "@/features/trading";
import { WatchlistStar } from "@/features/watchlist";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { resolveHubMarketVisual } from "@/widgets/dapp-hub/lib/hub-market-visual";

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
  /** @deprecated Kept for call-site compat — card is always Polymarket-style. */
  directoryStyle?: boolean;
  href?: string;
  className?: string;
  narrative?: string | null;
  participants?: number | null;
};

function formatCategoryLabel(slug: string): string {
  if (!slug || slug === "all") return "";
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
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
  if (ms <= 0) return { label: "Ended", urgent: true, expired: true };
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

function fmtCents(probability: number): string {
  const cents = Math.round(Math.max(0, Math.min(1, probability)) * 100);
  return `${cents}¢`;
}

function MarketCardImpl({
  market,
  isLive = false,
  hideWatchlist = false,
  href,
  className,
  narrative: narrativeProp,
}: MarketCardProps) {
  useFreshNow();
  const router = useRouter();

  const probability = market.probability ?? 0.5;
  const yesPct = Math.round(Math.max(0, Math.min(1, probability)) * 100);
  const noPct = 100 - yesPct;
  const volumeUsd = market.volumeUsd ?? 0;
  const narrative =
    narrativeProp?.trim() ||
    (typeof (market as Market & { narrative?: string | null }).narrative ===
    "string"
      ? (market as Market & { narrative?: string | null }).narrative?.trim()
      : null) ||
    null;

  const visual = useMemo(
    () => resolveHubMarketVisual(market.category, market.title),
    [market.category, market.title],
  );
  const CategoryIcon = visual.Icon;
  const remaining = useMemo(
    () => timeRemaining(market.closesAt),
    [market.closesAt],
  );
  const isOpen = market.status === "OPEN" && !remaining.expired;
  const showLive = isLive || isOpen;
  const detailsHref = href ?? ROUTES.market(market.slug);
  const deployed = Boolean(market.onChainAddress?.trim());
  const canTrade = deployed && isOpen;
  const categoryLabel = formatCategoryLabel(market.category) || "Market";

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
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl",
        "border border-[var(--border)] bg-[var(--card)]",
        "transition-[border-color,box-shadow,transform] duration-150",
        "hover:-translate-y-px hover:border-[var(--border-strong)] hover:shadow-[0_12px_28px_-16px_color-mix(in_srgb,var(--foreground)_28%,transparent)]",
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        {/* Header: icon + title + chance */}
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: visual.bg }}
            aria-hidden
          >
            <CategoryIcon
              className="size-4"
              style={{ color: visual.iconColor }}
            />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[var(--foreground)] group-hover:text-[var(--accent)]">
              {market.title}
            </h3>
            {narrative ? (
              <p className="mt-1 truncate text-[11px] text-[var(--foreground-muted)]">
                {narrative}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 pt-0.5 text-right">
            <p className="text-[18px] font-bold tabular-nums leading-none text-[var(--foreground)]">
              {yesPct}%
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
              chance
            </p>
          </div>
        </div>

        {/* Probability track */}
        <div
          className="flex h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
          aria-hidden
        >
          <div
            className="h-full bg-[var(--yes)] transition-[width] duration-300"
            style={{ width: `${yesPct}%` }}
          />
          <div
            className="h-full bg-[var(--no)] transition-[width] duration-300"
            style={{ width: `${noPct}%` }}
          />
        </div>

        {/* Yes / No action row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!canTrade}
            title={!deployed ? "Market not yet deployed" : "Buy YES"}
            onClick={(e) => handleSideClick("YES", e)}
            className={cn(
              "flex h-10 items-center justify-between rounded-lg px-3 text-[13px] font-semibold transition",
              "bg-[color-mix(in_srgb,var(--yes)_14%,transparent)] text-[var(--yes)]",
              "ring-1 ring-[color-mix(in_srgb,var(--yes)_28%,transparent)]",
              canTrade
                ? "hover:bg-[color-mix(in_srgb,var(--yes)_22%,transparent)]"
                : "cursor-not-allowed opacity-40",
            )}
          >
            <span>Yes</span>
            <span className="tabular-nums">{fmtCents(probability)}</span>
          </button>
          <button
            type="button"
            disabled={!canTrade}
            title={!deployed ? "Market not yet deployed" : "Buy NO"}
            onClick={(e) => handleSideClick("NO", e)}
            className={cn(
              "flex h-10 items-center justify-between rounded-lg px-3 text-[13px] font-semibold transition",
              "bg-[color-mix(in_srgb,var(--no)_14%,transparent)] text-[var(--no)]",
              "ring-1 ring-[color-mix(in_srgb,var(--no)_28%,transparent)]",
              canTrade
                ? "hover:bg-[color-mix(in_srgb,var(--no)_22%,transparent)]"
                : "cursor-not-allowed opacity-40",
            )}
          >
            <span>No</span>
            <span className="tabular-nums">{fmtCents(1 - probability)}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--foreground-muted)]">
            {showLive && !remaining.expired ? (
              <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-[var(--yes)]">
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[var(--yes)]/70" />
                  <span className="relative size-1.5 rounded-full bg-[var(--yes)]" />
                </span>
                Live
              </span>
            ) : null}
            <span className="truncate font-medium uppercase tracking-wide">
              {categoryLabel}
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {formatCompactUsd(volumeUsd)} Vol
            </span>
            <span aria-hidden>·</span>
            <span
              className={cn(
                "tabular-nums",
                remaining.urgent && "text-[var(--no)]",
              )}
            >
              {remaining.expired
                ? remaining.label
                : `Ends ${remaining.label}`}
            </span>
          </div>

          {!hideWatchlist ? (
            <WatchlistStar
              id={market.id}
              size="sm"
              className="shrink-0 text-[var(--foreground-muted)] hover:text-[var(--warning)]"
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export const MarketCard = memo(MarketCardImpl);
