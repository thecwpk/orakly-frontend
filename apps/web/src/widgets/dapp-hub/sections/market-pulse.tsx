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
      className={cn("size-4 shrink-0", className)}
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
    <div className="hub-dapp-pulse hub-glass-card">
      <div className="border-b border-[var(--hub-border)] px-4 py-3 sm:px-6">
        <div className="hub-dapp-skel h-3 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-0 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="hub-dapp-pulse-cell border-b border-[var(--hub-border)] sm:border-r"
          >
            <div className="hub-dapp-skel h-2.5 w-16" />
            <div className="hub-dapp-skel h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 border-t border-[var(--hub-border)] px-4 py-4 sm:px-6">
        <div className="hub-dapp-skel h-11 w-36 rounded-lg" />
        <div className="hub-dapp-skel h-11 w-36 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Section 1 — Market Pulse: full-width desk header with live count-up stats.
 */
export function MarketPulse() {
  const statsQ = useHomeStatsQuery();
  const loading = statsQ.isLoading && !statsQ.data && !statsQ.isError;

  if (loading) {
    return (
      <section
        className="hub-section hub-section-enter !pt-5 sm:!pt-6"
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
      value: <SentimentPill value={pulse.marketSentiment} />,
    },
    {
      key: "meta",
      label: "Current Meta",
      value: (
        <span className="line-clamp-2 text-base font-semibold leading-snug text-[var(--hub-fg)] sm:text-lg">
          {pulse.currentMeta}
        </span>
      ),
    },
    {
      key: "chain",
      label: "Top Chain",
      value: (
        <span className="inline-flex items-center gap-2 text-[var(--hub-fg)]">
          <BnbChainIcon />
          <span className="font-semibold tracking-wide">{pulse.topChain}</span>
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
      label: "24H Trading Volume",
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
      className="hub-section hub-section-enter !pt-5 sm:!pt-6"
      aria-label="Market Pulse"
    >
      <div className="hub-dapp-pulse hub-glass-card relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--hub-primary-bright)]/45 to-transparent"
          aria-hidden
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hub-border)] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--hub-success)]/70" />
              <span className="relative size-2.5 rounded-full bg-[var(--hub-success)] shadow-[0_0_8px_rgba(0,212,170,0.55)]" />
            </span>
            <p className="hub-dapp-stat-label !text-[11px]">Market Pulse</p>
            <span className="hidden text-[11px] text-[var(--hub-muted)] sm:inline">
              · today
            </span>
          </div>
          <span className="hub-dapp-stat-label !normal-case hub-dapp-move-up">
            Live
          </span>
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

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--hub-border)] px-4 py-4 sm:px-6">
          <Link href={ROUTES.markets} className="hub-cta-gold !min-h-[2.75rem]">
            Explore Markets
          </Link>
          <Link href={ROUTES.narratives} className="hub-cta-violet !min-h-[2.75rem]">
            View Narratives
          </Link>
        </div>
      </div>
    </section>
  );
}
