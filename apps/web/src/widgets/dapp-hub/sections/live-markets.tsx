"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/api/client/http-client";
import { useOpenTradeModal } from "@/features/trading";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { queryKeys } from "@/shared/api/query-keys";
import { unwrapApiResult } from "@/shared/api/unwrap";
import type { LiveMarketCardDto } from "@/shared/contracts/live-markets";
import { fmtCount, fmtUsdCompact } from "../lib/format-hub-metrics";
import { marketToTradeModal } from "../lib/open-hub-trade";
import { WatchlistStar } from "@/features/watchlist";

type LiveTab = "trending" | "volume" | "newest" | "ending";

const TABS: { id: LiveTab; label: string; emptyEmoji: string }[] = [
  { id: "trending", label: "Trending", emptyEmoji: "🔥" },
  { id: "volume", label: "Highest Volume", emptyEmoji: "📊" },
  { id: "newest", label: "New", emptyEmoji: "✨" },
  { id: "ending", label: "Ending Soon", emptyEmoji: "⏰" },
];

function categoryBadgeClass(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("meme")) return "bg-violet-500/15 text-violet-300 ring-violet-400/25";
  if (c.includes("defi")) return "bg-sky-500/15 text-sky-300 ring-sky-400/25";
  if (/\bai\b/.test(c) || c.includes("artificial")) {
    return "bg-teal-500/15 text-teal-300 ring-teal-400/25";
  }
  if (
    c.includes("layer") ||
    c.includes("l1") ||
    c.includes("chain") ||
    c.includes("solana") ||
    c.includes("base")
  ) {
    return "bg-orange-500/15 text-orange-300 ring-orange-400/25";
  }
  return "bg-white/[0.06] text-zinc-400 ring-white/[0.08]";
}

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimeRemaining(iso: string): {
  label: string;
  urgent: boolean;
  expired: boolean;
} {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) {
    return { label: "EXPIRED", urgent: true, expired: true };
  }
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  const urgent = ms < 24 * 60 * 60 * 1000;

  let label: string;
  if (days > 0) label = `${days}d ${hours}h`;
  else if (hours > 0) label = `${hours}h ${mins}m`;
  else label = `${Math.max(1, mins)}m`;

  return { label, urgent, expired: false };
}

async function fetchLiveMarkets(
  tab: LiveTab,
  limit = 6,
): Promise<LiveMarketCardDto[]> {
  const qs = new URLSearchParams({
    status: "OPEN",
    limit: String(limit),
    sort: tab,
  });
  const res = await apiClient.request<LiveMarketCardDto[]>(
    `/api/v1/markets?${qs.toString()}`,
  );
  return unwrapApiResult(res);
}

export function LiveMarketCard({ market }: { market: LiveMarketCardDto }) {
  const router = useRouter();
  const openTrade = useOpenTradeModal();
  const yesPct = Math.round(Math.max(0, Math.min(1, market.probability)) * 100);
  const noPct = 100 - yesPct;
  const remaining = formatTimeRemaining(market.closesAt);
  const deployed = Boolean(market.onChainAddress?.trim());
  const creator = market.creatorAddress?.trim() || null;

  function onTrade(side: "YES" | "NO", e: MouseEvent) {
    e.stopPropagation();
    if (!deployed) return;
    openTrade(marketToTradeModal(market), side);
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => router.push(ROUTES.market(market.slug))}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(ROUTES.market(market.slug));
        }
      }}
      className={cn(
        "cursor-pointer relative rounded-2xl border border-[var(--hub-border)] bg-[var(--hub-card)] p-4",
        "transition hover:border-[var(--hub-border-strong)] hover:shadow-lg hover:shadow-black/20",
      )}
    >
      <WatchlistStar id={market.id} size="xs" absolute />
      {/* Row 1 — Meta */}
      <div className="flex items-start justify-between gap-2 pr-8">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
              categoryBadgeClass(market.category),
            )}
          >
            {market.category || "Other"}
          </span>
          {market.narrative ? (
            <span className="rounded-full border border-[var(--hub-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--hub-muted)]">
              {market.narrative}
            </span>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ring-1",
            remaining.expired || remaining.urgent
              ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
              : "bg-white/[0.05] text-[var(--hub-muted)] ring-white/[0.08]",
          )}
        >
          {remaining.label}
        </span>
      </div>

      {/* Row 2 — Question */}
      <h3 className="mt-3 line-clamp-2 text-[15px] font-medium leading-snug text-[var(--hub-fg)]">
        {market.title}
      </h3>
      {creator ? (
        <Link
          href={ROUTES.traderProfile(creator)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 inline-block text-[11px] text-[var(--hub-muted)] transition hover:text-[var(--hub-fg)]"
        >
          by {shortenAddress(creator)}
        </Link>
      ) : null}

      {/* Row 3 — Probability */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[12px] font-bold">
          <span className="text-emerald-400">YES {yesPct}%</span>
          <span className="text-rose-400">NO {noPct}%</span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-black/30">
          <div className="h-full bg-emerald-500" style={{ width: `${yesPct}%` }} />
          <div className="h-full bg-rose-500" style={{ width: `${noPct}%` }} />
        </div>
      </div>

      {/* Row 4 — Stats */}
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-[var(--hub-muted)]">
        <span>Volume: {fmtUsdCompact(market.volumeUsd)}</span>
        <span>Liquidity: {fmtUsdCompact(market.liquidityUsd)}</span>
        <span>Participants: {fmtCount(market.participants)} traders</span>
        {creator ? <span>Creator: {shortenAddress(creator)}</span> : null}
      </div>

      {/* Row 5 — Actions */}
      <div className="mt-4 flex w-full overflow-hidden rounded-xl">
        <button
          type="button"
          disabled={!deployed}
          title={!deployed ? "Market not yet deployed" : "Buy YES"}
          onClick={(e) => onTrade("YES", e)}
          className={cn(
            "flex-1 px-3 py-2.5 text-[13px] font-bold text-white transition",
            "rounded-l-xl",
            deployed
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "cursor-not-allowed bg-zinc-600/50 text-zinc-400",
          )}
        >
          YES ↑
        </button>
        <button
          type="button"
          disabled={!deployed}
          title={!deployed ? "Market not yet deployed" : "Buy NO"}
          onClick={(e) => onTrade("NO", e)}
          className={cn(
            "flex-1 px-3 py-2.5 text-[13px] font-bold text-white transition",
            "rounded-r-xl",
            deployed
              ? "bg-rose-600 hover:bg-rose-500"
              : "cursor-not-allowed bg-zinc-600/50 text-zinc-400",
          )}
        >
          NO ↓
        </button>
      </div>

      <Link
        href={ROUTES.market(market.slug)}
        onClick={(e) => e.stopPropagation()}
        className="mt-2.5 inline-flex text-[12px] font-medium text-[var(--hub-muted)] transition hover:text-[var(--hub-primary-bright)]"
      >
        View Details →
      </Link>
    </article>
  );
}

/**
 * Section 3 — Live Markets: tabbed tradable market cards.
 */
export function LiveMarkets() {
  const [tab, setTab] = useState<LiveTab>("trending");
  const activeTab = useMemo(() => TABS.find((t) => t.id === tab) ?? TABS[0]!, [tab]);

  const query = useQuery({
    queryKey: queryKeys.hub.liveMarkets(tab, 6),
    queryFn: () => fetchLiveMarkets(tab, 6),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const markets = (query.data ?? []).slice(0, 6);

  return (
    <section className="hub-section" aria-label="Live Markets">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-[var(--hub-fg)]">
            Live Markets
          </h2>
          <p className="mt-1 text-[13px] text-[var(--hub-muted)]">
            Active prediction markets on BSC Testnet
          </p>
        </div>
        <Link
          href={ROUTES.markets}
          className="text-[13px] font-semibold text-[var(--hub-primary-bright)] transition hover:underline"
        >
          View All →
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Market sort">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
                active
                  ? "bg-[var(--hub-primary)] text-white"
                  : "text-[var(--hub-muted)] hover:underline hover:text-[var(--hub-fg)]",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {query.isLoading && markets.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-56 rounded-2xl" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <p className="rounded-2xl border border-[var(--hub-border)] bg-[var(--hub-card)] px-4 py-10 text-center text-[14px] text-[var(--hub-muted)]">
          <span className="mr-1.5" aria-hidden>
            {activeTab.emptyEmoji}
          </span>
          No {activeTab.label.toLowerCase()} markets right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {markets.map((market) => (
            <LiveMarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </section>
  );
}
