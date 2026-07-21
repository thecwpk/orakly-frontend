"use client";

import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { formatCompactUsd } from "@orakly/utils";

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

function AttentionPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative h-[4.5rem] w-full overflow-hidden", className)}
      aria-hidden
    >
      <svg
        viewBox="0 0 480 72"
        className="h-full w-full"
        preserveAspectRatio="none"
        role="presentation"
      >
        <defs>
          <linearGradient id="orakly-pulse-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--background)" stopOpacity="1" />
            <stop offset="12%" stopColor="var(--background)" stopOpacity="0" />
            <stop offset="88%" stopColor="var(--background)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--background)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <g className="orakly-attention-pulse">
          <path
            d="M0 44 C40 40, 70 28, 110 36 S170 52, 210 38 S270 18, 310 30 S370 54, 410 40 S460 28, 480 34"
            fill="none"
            stroke="#3a3d45"
            strokeWidth="1.25"
          />
          <path
            d="M0 38 C50 48, 90 22, 130 34 S190 58, 230 42 S290 20, 340 36 S400 50, 440 32 S470 26, 480 30"
            fill="none"
            stroke="#4a4e58"
            strokeWidth="1.25"
          />
          <path
            d="M0 50 C45 42, 85 56, 125 44 S185 24, 225 40 S285 60, 325 46 S385 22, 425 36 S465 48, 480 42"
            fill="none"
            stroke="#5c4fc7"
            strokeWidth="1.35"
            opacity="0.55"
          />
          <path
            d="M0 32 C55 26, 95 44, 140 30 S200 14, 245 28 S305 48, 350 34 S410 16, 455 28 S475 34, 480 30"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.6"
          />
        </g>
        <rect width="480" height="72" fill="url(#orakly-pulse-fade)" />
      </svg>
    </div>
  );
}

/**
 * Hub hero — narrative trading pitch + attention pulse signature.
 * Desktop: two columns within one viewport. Mobile: stacked.
 */
export function Hero() {
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
          <AttentionPulse className="mb-5" />
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
