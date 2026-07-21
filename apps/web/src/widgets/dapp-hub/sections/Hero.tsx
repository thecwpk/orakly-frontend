"use client";

import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { formatCompactUsd } from "@orakly/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchHomeStats } from "@/shared/api/fetchers/hub-home";
import { Sparkline } from "@/shared/ui";
import { useEffect, useMemo, useState } from "react";

type SnippetMarket = {
  id: string;
  question: string;
  yesPct: number;
  volumeUsd: number;
  offsetClass: string;
};

const SNIPPETS: readonly SnippetMarket[] = [
  {
    id: "ai-vs-l2",
    question: "Will AI agent tokens outperform L2 tokens this month?",
    yesPct: 62,
    volumeUsd: 1_240_000,
    offsetClass: "translate-x-0 translate-y-0 sm:translate-x-2",
  },
  {
    id: "meme-flip-defi",
    question: "Does a new memecoin narrative flip DeFi as top category this week?",
    yesPct: 41,
    volumeUsd: 890_000,
    offsetClass: "translate-x-0 -translate-y-1 sm:translate-x-8 sm:-translate-y-3",
  },
  {
    id: "restaking-vol",
    question: "Will restaking narrative volume exceed $10M by Aug 31?",
    yesPct: 54,
    volumeUsd: 2_100_000,
    offsetClass: "translate-x-0 translate-y-1 sm:translate-x-4 sm:translate-y-2",
  },
];

function OddsBar({ yesPct }: { yesPct: number }) {
  const noPct = 100 - yesPct;
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-medium tabular-nums">
        <span className="text-[var(--yes)]">YES {yesPct}%</span>
        <span className="text-[var(--no)]">NO {noPct}%</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-[3px] bg-[var(--border)]">
        <div
          className="h-full bg-[var(--yes)]"
          style={{ width: `${yesPct}%` }}
          aria-hidden
        />
        <div
          className="h-full bg-[var(--no)]"
          style={{ width: `${noPct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

function MarketSnippet({ market }: { market: SnippetMarket }) {
  return (
    <article
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] p-3.5",
        market.offsetClass,
      )}
    >
      <p
        className="text-[13px] font-medium leading-snug text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui" }}
      >
        {market.question}
      </p>
      <OddsBar yesPct={market.yesPct} />
      <p className="mt-2 text-[11px] tabular-nums text-[var(--foreground-muted)]">
        Vol {formatCompactUsd(market.volumeUsd)}
      </p>
    </article>
  );
}

function clamp0to100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function AttentionPulse({
  className,
  series,
  current,
}: {
  className?: string;
  series: readonly number[];
  current: number | null;
}) {
  return (
    <div
      className={cn(
        "relative h-[4.5rem] w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--background-secondary)_95%,transparent)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--accent)]/12 via-transparent to-[var(--accent)]/12" />
      <div className="relative flex h-full items-center gap-3 px-4">
        <div className="min-w-[56px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
            Index
          </p>
          <p className="mt-1 text-[20px] font-semibold tabular-nums text-[var(--foreground)]">
            {current == null ? "—" : Math.round(current)}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <Sparkline
            data={series}
            width={480}
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

/**
 * Hub hero — narrative trading pitch + attention pulse signature.
 * Desktop: two columns within one viewport. Mobile: stacked.
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

  return (
    <section
      aria-label="Orakly hero"
      className="relative flex flex-col justify-start border-b border-[var(--border)] pb-12 pt-8 sm:pb-14 sm:pt-10 lg:min-h-[min(100dvh-3.5rem,40rem)] lg:justify-center lg:pb-16 lg:pt-12"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        <div className="max-w-xl">
          <h1
            className="text-balance text-[2rem] font-semibold leading-[1.12] tracking-tight text-[var(--foreground)] sm:text-[2.5rem] lg:text-[2.75rem]"
            style={{
              fontFamily: "var(--font-display), var(--font-sans), system-ui",
            }}
          >
            Trade which crypto narrative wins next
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--foreground-muted)]">
            Narratives are the rotations crypto traders actually watch: AI
            agents, L2s, memecoins, DeFi, restaking. Orakly turns that attention
            into tradable odds.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={ROUTES.narratives}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 text-[13px] font-semibold text-[var(--accent-foreground)] transition-colors",
                "hover:bg-[var(--accent-hover)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
              )}
            >
              Explore Narratives
            </Link>
            <Link
              href={ROUTES.leaderboard}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent px-5 text-[13px] font-semibold text-[var(--foreground)] transition-colors",
                "hover:border-[var(--border-strong)] hover:bg-white/[0.02]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
              )}
            >
              View Leaderboard
            </Link>
          </div>
        </div>

        <div className="relative min-w-0">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
            Attention pulse
          </p>
          <AttentionPulse
            className="mb-5"
            series={series}
            current={clampedAttentionIndex}
          />
          <div className="flex flex-col gap-3">
            {SNIPPETS.map((m) => (
              <MarketSnippet key={m.id} market={m} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
