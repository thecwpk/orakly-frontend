"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useHomeStatsQuery } from "@/shared/api/hooks";
import type { MarketSentiment } from "@/shared/contracts/hub-home";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { HubCountUp } from "../components/hub-count-up";
import { resolveMarketPulseStats } from "../lib/market-pulse-stats";

function fmtUsd(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function sentimentTone(s: MarketSentiment): {
  text: string;
  bg: string;
  border: string;
  dot: string;
} {
  if (s === "Bullish") {
    return {
      text: "text-[var(--hub-success)]",
      bg: "bg-[var(--hub-success-bg)]",
      border: "border-[var(--hub-success)]/25",
      dot: "bg-[var(--hub-success)]",
    };
  }
  if (s === "Bearish") {
    return {
      text: "text-[var(--hub-danger)]",
      bg: "bg-[var(--hub-danger-bg)]",
      border: "border-[var(--hub-danger)]/25",
      dot: "bg-[var(--hub-danger)]",
    };
  }
  return {
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-400/25",
    dot: "bg-amber-400",
  };
}

function SentimentPill({
  value,
  size = "md",
}: {
  value: MarketSentiment;
  size?: "sm" | "md";
}) {
  const tone = sentimentTone(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        tone.bg,
        tone.border,
        tone.text,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone.dot)} aria-hidden />
      {value}
    </span>
  );
}

function BnbChainIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-3.5 shrink-0", className)}
      aria-hidden
    >
      <path
        fill="#F0B90B"
        d="M12 2.1 6.85 5.08v2.97L12 5.08l5.15 2.97V5.08L12 2.1Zm0 5.94L6.85 11.02v2.97L12 11.02l5.15 2.97v-2.97L12 8.04ZM5.18 12.03 2 13.88l3.18 1.85 3.18-1.85-3.18-1.85Zm13.64 0-3.18 1.85 3.18 1.85L22 13.88l-3.18-1.85ZM6.85 15.95v2.97L12 21.9l5.15-2.98v-2.97L12 18.92l-5.15-2.97Z"
      />
    </svg>
  );
}

function PulseSkeleton() {
  return (
    <div className="hub-dapp-pulse hub-dapp-pulse--strip hub-glass-card">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--hub-border)] px-3 py-2.5 sm:px-4">
        <div className="hub-dapp-skel h-2.5 w-28" />
        <div className="flex gap-2">
          <div className="hub-dapp-skel h-8 w-28 rounded-lg" />
          <div className="hub-dapp-skel h-8 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-0 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="hub-dapp-pulse-cell border-b border-[var(--hub-border)] sm:border-r">
            <div className="hub-dapp-skel h-2 w-14" />
            <div className="hub-dapp-skel h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Market Pulse — dense full-width desk strip (single source of platform KPIs).
 */
export function MarketPulse() {
  const statsQ = useHomeStatsQuery();
  const loading = statsQ.isLoading && !statsQ.data && !statsQ.isError;

  if (loading) {
    return (
      <section
        className="hub-section hub-section--pulse hub-section-enter"
        aria-label="Market Pulse"
      >
        <PulseSkeleton />
      </section>
    );
  }

  const pulse = resolveMarketPulseStats(statsQ.data, {
    apiError: statsQ.isError,
  });
  const attentionTone = sentimentTone(pulse.attentionTag);

  const cells: {
    key: string;
    label: string;
    value: ReactNode;
    sub?: ReactNode;
  }[] = [
    {
      key: "attention",
      label: "Attention Index",
      value: (
        <HubCountUp
          value={pulse.attentionIndex}
          formatter={(n) => String(Math.round(n))}
          className={cn("tabular-nums", attentionTone.text)}
        />
      ),
      sub: <SentimentPill value={pulse.attentionTag} size="sm" />,
    },
    {
      key: "sentiment",
      label: "Market Sentiment",
      value: <SentimentPill value={pulse.marketSentiment} size="sm" />,
    },
    {
      key: "meta",
      label: "Current Meta",
      value: (
        <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--hub-fg)] sm:text-sm">
          {pulse.currentMeta}
        </span>
      ),
    },
    {
      key: "chain",
      label: "Top Chain",
      value: (
        <span className="inline-flex items-center gap-1.5 text-[var(--hub-fg)]">
          <BnbChainIcon />
          <span className="text-[13px] font-semibold tracking-wide sm:text-sm">
            {pulse.topChain}
          </span>
        </span>
      ),
    },
    {
      key: "live",
      label: "Live Markets",
      value: (
        <HubCountUp
          value={pulse.liveMarkets}
          className="tabular-nums text-[var(--hub-fg)]"
        />
      ),
    },
    {
      key: "volume",
      label: "24H Volume",
      value: (
        <HubCountUp
          value={pulse.volume24hUsd}
          formatter={fmtUsd}
          className="tabular-nums text-[var(--hub-success)]"
        />
      ),
    },
    {
      key: "oi",
      label: "Open Interest",
      value: (
        <HubCountUp
          value={pulse.openInterest}
          formatter={fmtUsd}
          className="tabular-nums text-sky-300"
        />
      ),
    },
    {
      key: "traders",
      label: "Active Traders",
      value: (
        <HubCountUp
          value={pulse.activeTraders}
          className="tabular-nums text-[var(--hub-fg)]"
        />
      ),
    },
  ];

  return (
    <section
      className="hub-section hub-section--pulse hub-section-enter"
      aria-label="Market Pulse"
    >
      <div className="hub-dapp-pulse hub-dapp-pulse--strip hub-glass-card relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--hub-primary-bright)]/40 to-transparent"
          aria-hidden
        />

        <div className="flex items-center justify-between gap-3 border-b border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-fg)_3%,transparent)] px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--hub-success)]/70" />
              <span className="relative size-2 rounded-full bg-[var(--hub-success)] shadow-[0_0_6px_rgba(0,212,170,0.5)]" />
            </span>
            <p className="hub-dapp-stat-label !text-[10px]">Market Pulse</p>
            <span className="hidden text-[10px] text-[var(--hub-muted)] sm:inline">
              · today
            </span>
          </div>

          <span
            className="rounded-full border border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-primary)_10%,transparent)] px-2 py-1 text-[10px] font-semibold text-[var(--hub-success)]"
            aria-label="Live"
          >
            Live
          </span>

          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.markets}
              className="hub-cta-gold hub-cta-compact"
            >
              Explore Markets
            </Link>
            <Link
              href={ROUTES.narratives}
              className="hub-cta-violet hub-cta-compact"
            >
              View Narratives
            </Link>
          </div>
        </div>

        <div
          className={cn(
            "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8",
            "divide-x divide-y divide-[var(--hub-border)] lg:divide-y-0",
          )}
        >
          {cells.map((cell) => (
            <div key={cell.key} className="hub-dapp-pulse-cell">
              <p className="hub-dapp-stat-label">{cell.label}</p>
              <div className="hub-dapp-stat-value">{cell.value}</div>
              {cell.sub ? <div className="mt-0.5">{cell.sub}</div> : null}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
