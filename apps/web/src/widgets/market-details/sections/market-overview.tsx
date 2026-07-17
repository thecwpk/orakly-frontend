"use client";

import { formatCompactUsd } from "@orakly/utils";
import Link from "next/link";
import { useCallback, useState } from "react";
import { LeaderboardAvatar } from "@/features/leaderboard/components/leaderboard-avatar";
import { WatchlistStar } from "@/features/watchlist";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import type { MarketDetailDto } from "@/shared/contracts/market-detail";

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function daysAgo(iso: string): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatEndDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusLabel(raw: string, status: string): { label: string; className: string } {
  const u = (raw || status).toUpperCase();
  if (u === "OPEN") {
    return {
      label: "Open",
      className: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    };
  }
  if (u === "RESOLVED") {
    return {
      label: "Resolved",
      className: "bg-blue-500/15 text-blue-300 ring-blue-400/30",
    };
  }
  if (u === "PAUSED") {
    return {
      label: "Paused",
      className: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    };
  }
  return {
    label: u.charAt(0) + u.slice(1).toLowerCase(),
    className: "bg-zinc-500/15 text-zinc-300 ring-white/10",
  };
}

function momentumBadge(momentum: string): string {
  const m = momentum.toLowerCase();
  if (m === "growing") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25";
  if (m === "cooling") return "bg-rose-500/15 text-rose-300 ring-rose-400/25";
  return "bg-zinc-500/15 text-zinc-300 ring-white/10";
}

function narrativeSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ShareButtons({ question }: { question: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${question}\n${url}`)}`;
  const tg = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(question)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copy}
        className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/[0.1]"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <a
        href={tweet}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/[0.1]"
      >
        X
      </a>
      <a
        href={tg}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/[0.1]"
      >
        Telegram
      </a>
    </div>
  );
}

export function MarketOverviewSection({ market }: { market: MarketDetailDto }) {
  const yesPct = Math.round(Math.max(0, Math.min(1, market.probability)) * 100);
  const noPct = 100 - yesPct;
  const status = statusLabel(market.rawStatus, market.status);
  const creator = market.creatorAddress;
  const narrative = market.narrative?.trim() || null;
  const resolution =
    market.resolutionSource?.trim() ||
    market.resolutionReason?.trim() ||
    market.description?.trim() ||
    "See market rules for resolution criteria.";

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
      {/* Left 60% */}
      <div className="min-w-0">
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-500">
          <Link href={ROUTES.markets} className="hover:text-blue-300">
            Markets
          </Link>
          <span aria-hidden>→</span>
          <Link
            href={`${ROUTES.markets}?category=${encodeURIComponent(market.category)}`}
            className="hover:text-blue-300"
          >
            {market.category}
          </Link>
          <span aria-hidden>→</span>
          <span className="truncate text-zinc-400">
            {market.title.length > 48 ? `${market.title.slice(0, 47)}…` : market.title}
          </span>
        </nav>

        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-zinc-50">
          {market.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-300 ring-1 ring-white/10">
            {market.category}
          </span>
          {narrative ? (
            <Link
              href={`/narratives/${encodeURIComponent(narrativeSlug(narrative))}`}
              className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-zinc-300 ring-1 ring-white/10 hover:bg-white/[0.1]"
            >
              {narrative}
            </Link>
          ) : null}
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1",
              status.className,
            )}
          >
            {status.label}
          </span>
          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-400/25">
            BSC Testnet
          </span>
        </div>

        <div className="mt-3 space-y-1 text-[13px] text-zinc-400">
          <p>
            Resolves via:{" "}
            <span className="text-zinc-200">{market.resolutionSource?.trim() || "N/A"}</span>
          </p>
          <p>
            End Date:{" "}
            <span className="text-zinc-200">{formatEndDate(market.closesAt)}</span>
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-zinc-400">
          <span>Created by:</span>
          {creator ? (
            <Link
              href={ROUTES.traderProfile(creator)}
              className="inline-flex items-center gap-1.5 font-mono text-zinc-200 hover:text-blue-300"
            >
              <LeaderboardAvatar address={creator} className="h-5 w-5 rounded-full" />
              {shortenAddress(creator)}
            </Link>
          ) : (
            <span className="text-zinc-300">Admin</span>
          )}
          <span className="text-zinc-500">·</span>
          <span>{daysAgo(market.createdAt)}</span>
          {market.creatorRewardPercent > 0 ? (
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
              Creator earns {market.creatorRewardPercent}% of fees
            </span>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/[0.06]">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-zinc-500">
            Resolution Rules
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-300">{resolution}</p>
        </div>
      </div>

      {/* Right 40% — stats */}
      <aside className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Probability
            </p>
            <p className="mt-1 text-[28px] font-bold leading-none text-emerald-400">
              YES {yesPct}%
            </p>
          </div>
          <p className="text-[28px] font-bold leading-none text-rose-400">NO {noPct}%</p>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            style={{ width: `${yesPct}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="Volume" value={formatCompactUsd(market.volumeUsd ?? 0)} />
          <Stat label="Liquidity" value={formatCompactUsd(market.liquidityUsd ?? 0)} />
          <Stat label="Participants" value={String(market.participants)} />
          <Stat
            label="Attention Score"
            value={
              market.attentionScore != null ? String(Math.round(market.attentionScore)) : "N/A"
            }
          />
          <Stat
            label="Conviction Score"
            value={
              market.convictionScore != null
                ? String(Math.round(market.convictionScore))
                : "N/A"
            }
          />
          <div>
            <p className="text-[11px] text-zinc-500">Momentum</p>
            <span
              className={cn(
                "mt-1 inline-flex rounded-md px-2 py-0.5 text-[12px] font-semibold ring-1",
                momentumBadge(market.momentum),
              )}
            >
              {market.momentum || "Stable"}
            </span>
          </div>
        </div>

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Share
          </p>
          <ShareButtons question={market.title} />
        </div>
      </aside>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}

export function MarketShareSection({
  question,
  marketId,
}: {
  question: string;
  marketId: string;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.08] p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-semibold text-zinc-100">Share</h2>
        <WatchlistStar id={marketId} size="sm" />
      </div>
      <ShareButtons question={question} />
    </section>
  );
}
