"use client";

import type { Market } from "@orakly/types";
import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  appendProbabilitySample,
  reconcileProbabilityAnchor,
  seedProbabilityHistory,
  useProbabilityHistory,
} from "@/features/markets/store/use-probability-history-store";
import { useOpenTradeModal } from "@/features/trading";
import { WatchlistStar } from "@/features/watchlist";
import { ROUTES } from "@/shared/constants/routes";
import { Sparkline } from "@/shared/ui";
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
  /** Hub `/dapp` browse grid — Polymarket-like: thumb + always-visible Yes/No + Vol footer. */
  directoryStyle?: boolean;
  href?: string;
  className?: string;
};

const ACCENT_RING: Record<MarketCardAccent, string> = {
  cyan: "neon-edge-cyan",
  violet: "neon-edge-violet",
  emerald: "neon-edge-cyan",
  rose: "neon-edge-rose",
  amber: "neon-edge-violet",
};

const ACCENT_YES_FILL: Record<MarketCardAccent, string> = {
  cyan: "from-cyan-400 via-cyan-300 to-emerald-400",
  violet: "from-violet-400 via-fuchsia-400 to-cyan-400",
  emerald: "from-emerald-400 via-teal-400 to-cyan-300",
  rose: "from-rose-400 via-orange-400 to-amber-400",
  amber: "from-amber-400 via-orange-400 to-rose-400",
};

const ACCENT_GLOW: Record<MarketCardAccent, string> = {
  cyan: "bg-cyan-400/[0.18]",
  violet: "bg-violet-400/[0.16]",
  emerald: "bg-emerald-400/[0.16]",
  rose: "bg-rose-400/[0.14]",
  amber: "bg-amber-400/[0.14]",
};

const ACCENT_VOL: Record<MarketCardAccent, string> = {
  cyan: "from-cyan-400/75 via-cyan-400/35 to-transparent",
  violet: "from-violet-400/75 via-violet-400/35 to-transparent",
  emerald: "from-emerald-400/75 via-emerald-400/35 to-transparent",
  rose: "from-rose-400/75 via-rose-400/35 to-transparent",
  amber: "from-amber-400/75 via-amber-400/35 to-transparent",
};

function timeUntilClose(iso: string): { label: string; isClosed: boolean } {
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return { label: "—", isClosed: true };
  if (ms <= 0) return { label: "closed", isClosed: true };
  const m = Math.floor(ms / 60_000);
  if (m < 60) return { label: `${m}m`, isClosed: false };
  const h = Math.floor(m / 60);
  if (h < 24) return { label: `${h}h`, isClosed: false };
  const d = Math.floor(h / 24);
  if (d < 30) return { label: `${d}d`, isClosed: false };
  const mo = Math.floor(d / 30);
  return { label: `${mo}mo`, isClosed: false };
}

function useFreshNow(intervalMs: number = 60_000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}

function toCents(p: number): string {
  return `${Math.round(Math.max(0, Math.min(1, p)) * 100)}¢`;
}

function formatBrowseCategory(slug: string): string {
  if (!slug || slug === "all") return "";
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Polymarket-style chance ring — arc = implied Yes %, label in center. */
function BrowseYesRing({
  yesPct,
  size = 48,
}: {
  yesPct: number;
  size?: number;
}) {
  const stroke = 2.5;
  const r = (size - stroke) / 2 - 0.75;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, yesPct));
  const dash = (clamped / 100) * c;
  const gap = c - dash;
  return (
    <div
      className="relative shrink-0 text-muted-foreground"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped} percent implied yes`}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-border"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-yes transition-[stroke-dasharray] duration-300 ease-out"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-mono text-[11px] font-medium tabular-nums tracking-tight text-yes sm:text-[12px]">
          {clamped}
          <span className="text-[8.5px] font-medium text-muted-foreground sm:text-[9.5px]">%</span>
        </span>
        <span className="mt-0.5 text-[6px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-[6.5px]">
          yes
        </span>
      </div>
    </div>
  );
}

function DirectoryTradeChip({
  side,
  disabled,
  onClick,
}: {
  side: "YES" | "NO";
  disabled?: boolean;
  onClick: () => void;
}) {
  const yes = side === "YES";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (disabled) return;
        onClick();
      }}
      disabled={disabled}
      aria-label={yes ? "Trade Yes" : "Trade No"}
      className={cn(
        "min-h-[32px] flex-1 rounded-md py-1.5 text-[11px] font-medium outline-none transition-[color,background-color,border-color,box-shadow] sm:min-h-[34px] sm:py-2",
        yes
          ? "border border-yes/35 bg-yes/10 text-yes hover:border-yes/50 hover:bg-yes/18 focus-visible:ring-2 focus-visible:ring-yes/30 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          : "border border-no/30 bg-no/10 text-no hover:border-no/45 hover:bg-no/16 focus-visible:ring-2 focus-visible:ring-no/30 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        disabled && "pointer-events-none opacity-45",
      )}
    >
      {yes ? "Yes" : "No"}
    </button>
  );
}

function MarketCardImpl({
  market,
  variant = "default",
  accent = "cyan",
  chrome = "neon",
  isLive = false,
  lastTradeAt = null,
  index = 0,
  volumeMax,
  hideWatchlist = false,
  directoryStyle = false,
  href,
  className,
}: MarketCardProps) {
  useFreshNow();

  const probability = market.probability ?? 0.5;
  const yesPct = Math.round(probability * 100);
  const noPct = 100 - yesPct;
  const volumeUsd = market.volumeUsd ?? 0;
  const liquidityUsd = market.liquidityUsd ?? 0;
  const creatorAddress = market.creatorAddress?.trim() || null;
  const attentionScore =
    market.attentionScore != null && Number.isFinite(market.attentionScore)
      ? market.attentionScore
      : null;
  const volRatio =
    volumeMax && volumeMax > 0
      ? Math.min(1, volumeUsd / volumeMax)
      : Math.min(1, volumeUsd / 1_000_000);

  const closing = useMemo(() => timeUntilClose(market.closesAt), [market.closesAt]);
  const isClosed = closing.isClosed || market.status !== "OPEN";

  useEffect(() => {
    seedProbabilityHistory(market.id, probability);
    reconcileProbabilityAnchor(market.id, probability);
  }, [market.id, probability]);

  useEffect(() => {
    if (!isLive) return;
    appendProbabilitySample(market.id, probability);
  }, [isLive, lastTradeAt, market.id, probability]);

  const history = useProbabilityHistory(market.id);
  const sparkData = history.length > 1 ? history : [probability, probability];

  const tradedAgo = lastTradeAt ? Math.max(0, Date.now() - lastTradeAt) : null;
  const tradedAgoLabel =
    tradedAgo === null
      ? null
      : tradedAgo < 60_000
        ? `${Math.max(1, Math.floor(tradedAgo / 1000))}s`
        : `${Math.floor(tradedAgo / 60_000)}m`;

  const detailsHref = href ?? ROUTES.market(market.slug);

  const openTradeModal = useOpenTradeModal();
  const tradeMarketId = useMemo(() => resolveTradeMarketId(market), [market]);
  const handleSideClick = useCallback(
    (side: "YES" | "NO") => {
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
      openTradeModal,
      tradeMarketId,
      market.slug,
      market.title,
      market.category,
      market.status,
      market.closesAt,
      market.onChainAddress,
      market.chainId,
      probability,
    ],
  );

  const isCompact = variant === "compact";
  const isFeatured = variant === "featured";
  const isSubtleChrome = chrome === "subtle";
  const pmBrowse = isCompact && directoryStyle;
  const thumbLetter = (market.title.trim()[0] ?? "?").toUpperCase();
  const browseCategoryLabel = formatBrowseCategory(market.category);

  const sparkW = isFeatured ? 72 : isCompact ? (isSubtleChrome ? 42 : 46) : 52;
  const sparkH = isFeatured ? 26 : isCompact ? 17 : 20;

  const titleClass = cn(
    "line-clamp-2 font-semibold tracking-tight text-foreground transition-colors duration-300",
    isCompact && "text-[11px] leading-snug sm:text-[12px]",
    !isCompact && !isFeatured && "text-[12px] leading-snug sm:text-[13px]",
    isFeatured && "text-[12.5px] leading-snug sm:text-[13.5px] md:text-[14.5px]",
  );

  const oddsClass = cn(
    "font-mono tabular-nums tracking-tight",
    isCompact && "text-[14px] font-bold leading-none sm:text-[15px]",
    !isCompact && !isFeatured &&
      "text-[14px] font-bold leading-none max-[380px]:text-[13px] sm:text-[17px] md:text-[18px]",
    isFeatured &&
      "text-[15px] font-bold leading-none sm:text-[19px] md:text-[21px]",
  );

  return (
    <motion.article
      initial={pmBrowse ? false : { opacity: 0, y: 6 }}
      whileInView={pmBrowse ? undefined : { opacity: 1, y: 0 }}
      viewport={pmBrowse ? undefined : { once: true, margin: "-24px" }}
      transition={
        pmBrowse
          ? undefined
          : { duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.018, 0.09) }
      }
      whileHover={pmBrowse ? undefined : { y: -2 }}
      className={cn(
        "group relative isolate flex flex-col overflow-hidden rounded-xl",
        "border transition-[box-shadow,border-color,transform] duration-200 ease-out",
        pmBrowse
          ? cn(
              "rounded-lg border-border/90 bg-gradient-to-b from-card via-card to-secondary/30",
              "shadow-sm ring-1 ring-border/60",
              "hover:border-primary/30 hover:from-secondary/45 hover:to-card hover:ring-primary/20",
            )
          : cn(
              "hub-card border border-[var(--hub-border)] bg-[var(--hub-card)]",
              "shadow-[0_4px_20px_rgb(0_0_0_/_0.22)]",
              "transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out",
              isSubtleChrome
                ? "hover:border-[var(--hub-border-strong)] hover:bg-[var(--hub-card-hover)]"
                : cn(
                    "hover:border-[var(--hub-border-strong)]",
                    ACCENT_RING[accent],
                  ),
            ),
        pmBrowse
          ? "p-3.5 sm:p-4"
          : isCompact
            ? "p-2 pb-7"
            : isFeatured
              ? "p-3 sm:p-3.5"
              : "p-2.5",
        className,
      )}
    >
      {/* Layered depth: top sheen */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[52%] bg-gradient-to-b from-white/[0.045] to-transparent",
          pmBrowse ? "hidden" : "opacity-70",
        )}
      />
      {pmBrowse ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-primary/[0.07] to-transparent"
        />
      ) : null}
      {/* Accent bloom — subtle idle, stronger on hover */}
      {!pmBrowse ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-10 -top-10 h-[8.5rem] w-[8.5rem] rounded-full blur-3xl transition-opacity duration-500 ease-out",
            ACCENT_GLOW[accent],
            "opacity-[0.35] group-hover:opacity-[0.62]",
          )}
        />
      ) : null}
      {/* Bottom weight */}
      {!pmBrowse ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--hub-bg-subtle)]/80 to-transparent"
        />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-primary/[0.06] to-transparent opacity-90"
        />
      )}

      <div className="relative flex flex-col gap-0">
        {pmBrowse ? (
          <div className="relative flex flex-col gap-3 sm:gap-3.5">
            <header className="flex items-start gap-2.5 sm:gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold uppercase tracking-tight text-muted-foreground ring-1 ring-border/80 sm:h-10 sm:w-10 sm:text-[12px]"
                aria-hidden
              >
                {thumbLetter}
              </div>
              <div className="min-w-0 flex-1 pt-px">
                <Link
                  href={detailsHref}
                  title={market.title}
                  className={cn(
                    "block min-h-[3.75rem] rounded-sm outline-none sm:min-h-[4rem]",
                    "focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  )}
                >
                  <h3 className="line-clamp-3 text-left text-[13px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-foreground sm:text-[13.5px] sm:leading-snug">
                    {market.title}
                  </h3>
                </Link>
                {browseCategoryLabel ? (
                  <p className="mt-1.5 truncate text-[9.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground/90">
                    {browseCategoryLabel}
                  </p>
                ) : null}
              </div>
              <BrowseYesRing yesPct={yesPct} size={46} />
            </header>

            <div
              className="grid grid-cols-2 gap-2 sm:gap-2"
              role="group"
              aria-label="Implied probability by outcome"
            >
              <div className="rounded-md border border-yes/20 bg-yes/8 px-2 py-1 text-center">
                <span className="block text-[8.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Yes
                </span>
                <span className="font-mono text-[11.5px] font-medium tabular-nums text-yes sm:text-[12px]">
                  {yesPct}%
                </span>
              </div>
              <div className="rounded-md border border-no/20 bg-no/8 px-2 py-1 text-center">
                <span className="block text-[8.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  No
                </span>
                <span className="font-mono text-[11.5px] font-medium tabular-nums text-no sm:text-[12px]">
                  {noPct}%
                </span>
              </div>
            </div>

            <div className="relative z-[1] overflow-hidden rounded-md border border-border/85 bg-muted/25 px-1.5 py-1.5">
              <div className="flex items-center justify-between gap-2 px-0.5 pb-1 pt-0.5">
                <span className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Live odds
                </span>
                <span className="font-mono text-[9.5px] font-medium tabular-nums text-yes">{yesPct}% yes</span>
              </div>
              <div className="flex w-full justify-center rounded-md bg-background/60 px-0.5 ring-1 ring-border/40">
                <Sparkline
                  data={sparkData}
                  tone="emerald"
                  width={168}
                  height={26}
                  fill
                  intensity="high"
                  strokeWidth={2}
                  padding={3}
                  ariaLabel={`Probability history for ${market.title}`}
                  showLastDot={isLive}
                />
              </div>
            </div>

            <div className="relative z-[1] grid grid-cols-2 gap-1.5 sm:gap-2">
              <DirectoryTradeChip side="YES" disabled={isClosed} onClick={() => handleSideClick("YES")} />
              <DirectoryTradeChip side="NO" disabled={isClosed} onClick={() => handleSideClick("NO")} />
            </div>

            <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5 sm:pt-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-muted-foreground">
                <span className="font-mono text-[10px] tabular-nums sm:text-[10.5px]">
                  <span>Vol </span>
                  <span className="text-foreground/80">{formatCompactUsd(volumeUsd)}</span>
                </span>
                <span className="text-muted-foreground/35" aria-hidden>
                  ·
                </span>
                <span className="font-mono text-[10px] tabular-nums sm:text-[10.5px]">
                  <span>Liq </span>
                  <span className="text-foreground/80">{formatCompactUsd(liquidityUsd)}</span>
                </span>
                {isLive ? (
                  <>
                    <span className="text-muted-foreground/35" aria-hidden>
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-medium uppercase tracking-wide text-yes/90">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yes shadow-[0_0_8px_color-mix(in_srgb,var(--yes)_60%,transparent)]" />
                      Live
                    </span>
                  </>
                ) : null}
              </div>
              {!hideWatchlist ? <WatchlistStar slug={market.slug} size="xs" /> : null}
            </div>
          </div>
        ) : (
          <>
            {/* SUPPORTIVE: category · live · spark · watchlist */}
            <header className="flex items-start gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                <span className="rounded-md bg-[var(--hub-bg-subtle)] px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)]">
                  {market.category}
                </span>
                {isLive ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/[0.14] px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-wide text-emerald-300/95 ring-1 ring-emerald-400/25 shadow-[0_0_12px_-4px_rgba(52,211,153,0.45)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                    </span>
                    Live
                  </span>
                ) : isClosed ? (
                  <span className="rounded-md bg-[var(--hub-bg-subtle)] px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-wide text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)]">
                    Closed
                  </span>
                ) : (
                  <span className="rounded-md bg-[var(--hub-bg-subtle)] px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-wide text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)]">
                    Open
                  </span>
                )}
                {tradedAgoLabel && isLive ? (
                  <span className="font-mono text-[9px] text-[var(--hub-muted)]">{tradedAgoLabel} ago</span>
                ) : null}
              </div>

              <div className="flex shrink-0 items-start gap-1.5 pl-1">
                <div className="rounded-md bg-[var(--hub-bg-subtle)] py-0.5 pl-1 pr-0.5 ring-1 ring-[var(--hub-border)]">
                  <Sparkline
                    data={sparkData}
                    tone={accent}
                    width={sparkW}
                    height={sparkH}
                    fill
                    showLastDot={isLive}
                    strokeWidth={isFeatured ? 1.75 : 1.5}
                    ariaLabel={`Probability sparkline for ${market.title}`}
                  />
                </div>
                {!hideWatchlist ? <WatchlistStar slug={market.slug} size="xs" /> : null}
              </div>
            </header>

            {/* PRIMARY: question */}
            <Link
              href={detailsHref}
              className={cn(
                "relative mt-2 block rounded-md outline-none",
                "focus-visible:ring-2 focus-visible:ring-cyan-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <h3 className={titleClass}>{market.title}</h3>
            </Link>

            {creatorAddress || attentionScore != null ? (
              <div className="relative mt-2 flex flex-wrap items-center gap-2">
                {creatorAddress ? (
                  <span
                    className="font-mono text-[9px] tabular-nums text-[var(--hub-muted)]"
                    title={creatorAddress}
                  >
                    {creatorAddress.slice(0, 6)}…{creatorAddress.slice(-4)}
                  </span>
                ) : null}
                {attentionScore != null ? (
                  <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-semibold text-blue-300 ring-1 ring-blue-400/25">
                    Attention {Math.round(attentionScore)}
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* SECONDARY: YES / NO */}
            <div className={cn("relative mt-2.5", !isCompact && "mt-3")}>
              <div className="flex items-end justify-between gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
                    Yes
                  </p>
                  <p className={cn(oddsClass, "text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.18)]")}>
                    {yesPct}
                    <span className="text-[0.65em] font-semibold text-cyan-500/80">%</span>
                  </p>
                </div>
                <div
                  className="hidden h-9 w-px shrink-0 bg-gradient-to-b from-transparent via-white/[0.14] to-transparent opacity-80 sm:block"
                  aria-hidden
                />
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
                    No
                  </p>
                  <p className={cn(oddsClass, "text-rose-400 drop-shadow-[0_0_20px_rgba(251,113,133,0.14)]")}>
                    {noPct}
                    <span className="text-[0.65em] font-semibold text-rose-500/75">%</span>
                  </p>
                </div>
              </div>

              <div className="relative mt-2 h-[3px] overflow-hidden rounded-full bg-[var(--hub-track-bg)] ring-1 ring-[var(--hub-border)]">
                <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white/[0.03] to-transparent" />
                <motion.div
                  key={`${market.id}-${yesPct}`}
                  className={cn(
                    "relative h-full rounded-full bg-gradient-to-r shadow-[0_0_14px_-3px_rgba(34,211,238,0.35)]",
                    ACCENT_YES_FILL[accent],
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${yesPct}%` }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            {/* TERTIARY: vol · liq · timer — uneven rhythm, not a symmetric grid */}
            <div
              className={cn(
                "relative mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-white/[0.055] pt-2",
                isFeatured && "sm:gap-x-5",
              )}
            >
              <div className="flex flex-col gap-0">
                <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
                  Vol
                </span>
                <span className="font-mono text-[10.5px] font-medium tabular-nums text-[var(--hub-fg)]">
                  {formatCompactUsd(volumeUsd)}
                </span>
              </div>
              <div className="hidden h-7 w-px bg-white/[0.06] sm:block" aria-hidden />
              <div className="flex flex-col gap-0">
                <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
                  Liq
                </span>
                <span className="font-mono text-[10.5px] font-medium tabular-nums text-[var(--hub-muted)]">
                  {formatCompactUsd(liquidityUsd)}
                </span>
              </div>
              <div className="ml-auto flex min-w-0 flex-col items-end gap-0 text-right sm:ml-0">
                <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
                  Resolve
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-mono text-[10px] tabular-nums ring-1",
                    "rounded-md px-1.5 py-0.5",
                    isClosed
                      ? "bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-[var(--hub-border)]"
                      : closing.label.endsWith("m") || closing.label.endsWith("h")
                        ? "bg-rose-500/10 text-rose-300 ring-rose-400/18"
                        : "bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-[var(--hub-border)]",
                  )}
                  title="Time until resolution"
                >
                  <Clock className="h-2.5 w-2.5 shrink-0 opacity-70" />
                  {isClosed ? "Closed" : `${closing.label}`}
                </span>
              </div>
            </div>

            {/* Volume intensity — thin, supportive */}
            <div className="relative mt-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
                  Flow vs book
                </span>
                <span className="font-mono text-[9px] tabular-nums text-[var(--hub-muted)]">
                  {Math.round(volRatio * 100)}%
                </span>
              </div>
              <div className="h-[2px] overflow-hidden rounded-full bg-[var(--hub-track-bg)] ring-1 ring-[var(--hub-border)]">
                <motion.div
                  className={cn("h-full rounded-full bg-gradient-to-r", ACCENT_VOL[accent])}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(volRatio * 100)}%` }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Trade actions — compact pills, not billboard buttons */}
      {!pmBrowse && isCompact ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 flex justify-end px-2 pb-1.5 pt-6",
            "translate-y-1 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100",
          )}
        >
          <Link
            href={detailsHref}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-lg bg-[var(--hub-card)] px-2 py-1 text-[10px] font-semibold text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] backdrop-blur-sm transition hover:bg-[var(--hub-primary-soft)] hover:text-[var(--hub-primary-bright)] hover:ring-[var(--hub-border-strong)]"
          >
            Trade
            <ArrowUpRight className="h-3 w-3 opacity-80" />
          </Link>
        </div>
      ) : !pmBrowse ? (
        <div className={cn("relative z-[1] grid grid-cols-2 gap-1.5", isFeatured ? "mt-3" : "mt-2.5")}>
          <TradeSideButton
            side="YES"
            cents={toCents(probability)}
            disabled={isClosed}
            featured={isFeatured}
            onClick={() => handleSideClick("YES")}
          />
          <TradeSideButton
            side="NO"
            cents={toCents(1 - probability)}
            disabled={isClosed}
            featured={isFeatured}
            onClick={() => handleSideClick("NO")}
          />
        </div>
      ) : null}
    </motion.article>
  );
}

function TradeSideButton({
  side,
  cents,
  disabled,
  featured,
  onClick,
}: {
  side: "YES" | "NO";
  cents: string;
  disabled?: boolean;
  featured?: boolean;
  onClick: () => void;
}) {
  const isYes = side === "YES";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (disabled) return;
        onClick();
      }}
      disabled={disabled}
      aria-label={`Buy ${side} at ${cents}`}
      className={cn(
        "relative min-h-[44px] touch-manipulation overflow-hidden rounded-lg px-2 py-2 text-left font-semibold ring-1 transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out sm:min-h-0",
        "outline-none focus-visible:ring-2 active:scale-[0.98]",
        featured ? "sm:py-1.5 text-[11px]" : "sm:py-1 text-[10px]",
        isYes
          ? "bg-cyan-500/[0.11] text-cyan-100 ring-cyan-400/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-cyan-500/[0.18] hover:shadow-[0_0_20px_-8px_rgba(34,211,238,0.35)] focus-visible:ring-cyan-400/40"
          : "bg-rose-500/[0.11] text-rose-100 ring-rose-400/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-rose-500/[0.18] hover:shadow-[0_0_20px_-8px_rgba(251,113,133,0.28)] focus-visible:ring-rose-400/40",
        disabled && "pointer-events-none opacity-45",
      )}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="uppercase tracking-wide opacity-90">
          Buy {side}
        </span>
        <span className="font-mono tabular-nums text-[9.5px] opacity-95">{cents}</span>
      </span>
    </button>
  );
}

export const MarketCard = memo(MarketCardImpl);
