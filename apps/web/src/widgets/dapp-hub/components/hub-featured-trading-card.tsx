"use client";

import type { Market } from "@orakly/types";
import { ArrowUpRight, Check, Share2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  reconcileProbabilityAnchor,
  seedProbabilityHistory,
  useProbabilityHistory,
} from "@/features/markets/store/use-probability-history-store";
import { WatchlistStar } from "@/features/watchlist";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { PrefetchLink } from "@/shared/ui";
import { useMarketTradesQuery } from "@/shared/api/hooks";
import { HubChartTapeOverlay } from "./hub-chart-tape-overlay";
import { HubSpotlightTradingChart } from "./hub-spotlight-trading-chart";
import { buildSpotlightNewsLines } from "../lib/hub-spotlight-news";
import { buildFeaturedSparkSeries } from "../lib/hub-sparkline-series";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Polymarket-style headline probability accent */
const PM_BLUE = "#2797FF";

function fmtUsdShort(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtEndsLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function useResizeClientRect<T extends HTMLElement>(fallbackW = 400, fallbackH = 200) {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: fallbackW, h: fallbackH });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw > 0 && ch > 0) setSize({ w: cw, h: ch });
    };
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    apply();
    return () => ro.disconnect();
  }, []);
  return [ref, size.w, size.h] as const;
}

function HubMarketThumb({
  category,
  title,
  className,
}: {
  category: string;
  title: string;
  className?: string;
}) {
  const letter = (category.trim().slice(0, 1) || title.trim().slice(0, 1) || "?").toUpperCase();
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/70 text-[12px] font-semibold tracking-tight text-foreground ring-1 ring-border sm:h-10 sm:w-10",
        className,
      )}
      aria-hidden
    >
      {letter}
    </div>
  );
}

function HubSpotlightShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${ROUTES.market(slug)}`;
    const nav = window.navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    try {
      if (typeof nav.share === "function") {
        await nav.share({ url, title: "Orakly market" });
        return;
      }
      await nav.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* cancelled or denied */
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label="Share market"
      title="Share market"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
    >
      {copied ? (
        <Check className="h-4 w-4 stroke-[2] text-yes" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4 stroke-[1.5]" aria-hidden />
      )}
    </button>
  );
}

function InlineProbabilityMove({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct === null) {
    return <span className="text-[13px] font-semibold tabular-nums text-muted-foreground">N/A</span>;
  }
  const up = deltaPct > 0;
  const flat = deltaPct === 0;
  const tone = flat ? "text-muted-foreground" : up ? "text-yes" : "text-no";
  const arrow = flat ? "" : up ? "▲" : "▼";
  const label = flat ? "0%" : `${up ? "+" : ""}${deltaPct}%`;

  return (
    <span className={cn("inline-flex items-center gap-1 text-[13px] font-semibold tabular-nums sm:text-[14px]", tone)}>
      {arrow ? <span aria-hidden>{arrow}</span> : null}
      <span>{label}</span>
    </span>
  );
}

/**
 * Polymarket-style hero: full-width header (thumb · title · actions), then left ≈45% (chance · trade · wire)
 * and right ≈55% (chart aligned to that block). Footer rail below.
 */
export function HubFeaturedTradingCard({
  market,
  isLive,
  queueMerged = false,
}: {
  market: Market;
  isLive: boolean;
  /** When true, card is stacked above spotlight queue — flat bottom, no outer radius. */
  queueMerged?: boolean;
}) {
  const probability = market.probability ?? 0.5;
  const yesPct = Math.round(probability * 100);
  const backendMarketId =
    market.backendMarketId ?? (UUID_RE.test(market.id) ? market.id : undefined);
  const tradesQ = useMarketTradesQuery(backendMarketId);

  useEffect(() => {
    seedProbabilityHistory(market.id, probability);
    reconcileProbabilityAnchor(market.id, probability);
  }, [market.id, probability]);

  useEffect(() => {
    const trades = tradesQ.data ?? [];
    for (const tr of trades) {
      const px = Number.parseFloat(tr.price);
      if (Number.isFinite(px) && px > 0) {
        reconcileProbabilityAnchor(market.id, px);
      }
    }
  }, [market.id, tradesQ.data]);

  const tradingLocked = market.status !== "OPEN";

  const tradeSideHref = (side: "YES" | "NO") =>
    tradingLocked
      ? ROUTES.market(market.slug)
      : `${ROUTES.market(market.slug)}?side=${side}`;

  const history = useProbabilityHistory(market.id);
  const sparkData = useMemo(
    () => buildFeaturedSparkSeries(market.id, probability, history),
    [market.id, probability, history],
  );

  const deltaPct = useMemo(() => {
    if (sparkData.length < 2) return null;
    const first = sparkData[0]!;
    const last = sparkData[sparkData.length - 1]!;
    return Math.round((last - first) * 100);
  }, [sparkData]);

  const newsLines = useMemo(() => buildSpotlightNewsLines(market.title), [market.title]);

  const [chartRef, chartW, chartH] = useResizeClientRect<HTMLDivElement>(420, 220);
  const chartPxW = Math.max(160, Math.floor(chartW) - 4);
  const chartPxH = Math.max(140, Math.floor(chartH) - 4);

  return (
    <article
      data-hub-featured-card
      className={cn(
        "flex min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        queueMerged &&
          "rounded-none border-0 border-b border-border/80 bg-transparent shadow-none ring-0",
      )}
    >
      {/*
        Layout: full-width header (thumb · title · share/star), then 45/55 grid so the chart only spans
        the “desk” block (chance → wire), matching PM-style alignment. Chart size follows its cell (RO).
      */}
      <div
        className={cn(
          "hub-featured-card__body box-border min-w-0 px-4 py-4 sm:px-5 sm:py-4 lg:px-5 lg:py-4",
        )}
      >
        {/* Row 1 — title rail (icons top-right) */}
        <header className="mb-4 flex min-w-0 items-start gap-3 sm:mb-4 sm:gap-3.5">
          <HubMarketThumb category={market.category} title={market.title} />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="mb-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {market.category}
              </span>
              {isLive ? (
                <>
                  <span className="text-muted-foreground/45" aria-hidden>
                    ·
                  </span>
                  <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wide text-yes">
                    Live
                  </span>
                </>
              ) : null}
            </div>
            <PrefetchLink href={ROUTES.market(market.slug)} className="group/t block min-w-0">
              <h3 className="max-w-[min(100%,32rem)] text-pretty text-[15px] font-semibold leading-snug tracking-tight text-foreground transition sm:text-[16px] group-hover/t:text-primary">
                {market.title}
              </h3>
            </PrefetchLink>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 self-start pt-0.5">
            <HubSpotlightShareButton slug={market.slug} />
            <WatchlistStar id={market.id} size="sm" className="rounded-md bg-transparent ring-0" />
          </div>
        </header>

        {/* Row 2 — desk + chart (reference ~45 / ~55) */}
        <div
          className={cn(
            "grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,43%)_minmax(0,57%)] lg:items-stretch lg:gap-5 lg:min-h-[240px]",
          )}
        >
          <div role="region" aria-label="Market summary" className="box-border flex min-h-0 min-w-0 flex-col">
            <section className="mb-3 min-w-0" aria-label="Current probability">
              <div className="flex min-w-0 flex-wrap items-end justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
                  <span
                    className="text-[1.95rem] font-semibold leading-none tracking-tight tabular-nums sm:text-[2.125rem]"
                    style={{ color: PM_BLUE }}
                  >
                    {yesPct}%
                  </span>
                  <span className="pb-0.5 text-[11.5px] font-medium leading-none text-muted-foreground sm:text-[12px]">
                    chance
                  </span>
                </div>
                <div className="shrink-0 pb-0.5">
                  <InlineProbabilityMove deltaPct={deltaPct} />
                </div>
              </div>
            </section>

            <section className="mb-3 min-w-0" aria-label="Trade side">
              <div className="grid min-h-9 grid-cols-2 gap-2">
                <PrefetchLink
                  href={tradeSideHref("YES")}
                  title={
                    tradingLocked
                      ? `View market · ${market.status.toLowerCase()}`
                      : "Open market: YES side"
                  }
                  className={cn(
                    "flex h-9 min-h-9 items-center justify-center rounded-lg px-2.5 text-[13px] font-semibold text-white shadow-sm transition-all",
                    "bg-yes hover:brightness-110",
                    tradingLocked && "opacity-80 hover:opacity-100",
                  )}
                >
                  Yes
                </PrefetchLink>
                <PrefetchLink
                  href={tradeSideHref("NO")}
                  title={
                    tradingLocked
                      ? `View market · ${market.status.toLowerCase()}`
                      : "Open market: NO side"
                  }
                  className={cn(
                    "flex h-9 min-h-9 items-center justify-center rounded-lg px-2.5 text-[13px] font-semibold text-white shadow-sm transition-all",
                    "bg-no hover:brightness-110",
                    tradingLocked && "opacity-80 hover:opacity-100",
                  )}
                >
                  No
                </PrefetchLink>
              </div>
              {tradingLocked ? (
                <p className="mt-1.5 text-center font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">
                  Opens market page · trading {market.status.toLowerCase()}
                </p>
              ) : null}
            </section>

            <section className="min-w-0" aria-label="Related context">
              <ul className="hub-featured-news flex flex-col gap-y-1.5">
                {newsLines.map((row, idx) => (
                  <li key={`${row.source}-${idx}`}>
                    <PrefetchLink
                      href={ROUTES.market(market.slug)}
                      className="group flex gap-2 rounded-md py-1.5 pl-0.5 pr-1 transition-colors hover:bg-[color-mix(in_srgb,var(--hub-bg-subtle)_70%,transparent)]"
                    >
                      <div
                        className="mt-0.5 h-5 w-5 shrink-0 rounded-sm bg-[color-mix(in_srgb,var(--hub-bg-subtle)_75%,transparent)] ring-1 ring-[var(--hub-border)]"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-baseline justify-between gap-2">
                          <p className="truncate font-mono text-[9px] font-medium uppercase tracking-wide text-[var(--hub-muted)]">
                            {row.source}
                          </p>
                          <p className="shrink-0 font-mono text-[9px] tabular-nums text-[var(--hub-muted)]">
                            {row.ago}
                          </p>
                        </div>
                        <p className="hub-featured-news-headline mt-0.5 line-clamp-2 text-[11.5px] font-medium leading-snug text-white">
                          {row.headline}
                        </p>
                      </div>
                    </PrefetchLink>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div
            ref={chartRef}
            className={cn(
              "relative flex min-h-[200px] min-w-0 flex-col justify-center bg-transparent sm:min-h-[220px] lg:min-h-[200px] lg:items-end",
            )}
            role="region"
            aria-label="Probability chart"
          >
            <div className="relative ml-auto h-full min-h-[180px] w-full max-w-full pl-1 lg:min-h-0 lg:pl-2">
              <HubSpotlightTradingChart
                variant="flush"
                data={sparkData}
                width={chartPxW}
                height={chartPxH}
                ariaLabel={`${market.title} probability`}
                className="ml-auto block max-h-full max-w-full"
              />
              <HubChartTapeOverlay seed={market.slug} />
            </div>
          </div>
        </div>
      </div>

      <footer className="hub-featured-card__footer border-t border-[var(--hub-border)] px-4 py-3 sm:px-5 sm:py-3.5 lg:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--hub-muted)]">
                Volume
              </span>
              <span className="hub-featured-footer-volume rounded-lg border border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-bg-subtle)_80%,transparent)] px-2.5 py-1 font-mono text-[12px] font-semibold tabular-nums tracking-tight text-[var(--hub-fg)]">
                {fmtUsdShort(market.volumeUsd)}
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
            <span className="font-mono text-[11px] tabular-nums text-[var(--hub-muted)]">
              Ends <span className="font-semibold text-white">{fmtEndsLong(market.closesAt)}</span>
            </span>
            <span className="hidden h-4 w-px bg-[var(--hub-border)] sm:block" aria-hidden />
            <PrefetchLink
              href={ROUTES.market(market.slug)}
              className="hub-featured-footer-cta inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--hub-primary)_45%,var(--hub-border))] bg-[color-mix(in_srgb,var(--hub-primary)_12%,transparent)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:border-[var(--hub-primary)] hover:bg-[color-mix(in_srgb,var(--hub-primary)_22%,transparent)]"
            >
              Full book
              <ArrowUpRight className="h-3.5 w-3.5 opacity-90" aria-hidden />
            </PrefetchLink>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--hub-muted)]">
              Orakly
            </span>
          </div>
        </div>
      </footer>
    </article>
  );
}
