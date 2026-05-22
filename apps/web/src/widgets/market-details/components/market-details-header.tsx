"use client";

import type { Market } from "@orakly/types";
import { formatCompactUsd } from "@orakly/utils";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Radio,
  Share2,
} from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { WatchlistStar } from "@/features/watchlist";
import { ROUTES } from "@/shared/constants/routes";
import { PrefetchLink } from "@/shared/ui";
import { cn } from "@/lib/utils";

// ───────────────────────── helpers

function timeUntil(iso: string): {
  label: string;
  isClosed: boolean;
  urgency: "calm" | "warm" | "hot";
} {
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0)
    return { label: "closed", isClosed: true, urgency: "calm" };
  const m = Math.floor(ms / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const mo = Math.floor(d / 30);
  const urgency: "calm" | "warm" | "hot" =
    h < 6 ? "hot" : d < 2 ? "warm" : "calm";
  if (m < 60) return { label: `${m}m`, isClosed: false, urgency };
  if (h < 24) return { label: `${h}h ${m % 60}m`, isClosed: false, urgency };
  if (d < 30) return { label: `${d}d ${h % 24}h`, isClosed: false, urgency };
  return { label: `${mo}mo`, isClosed: false, urgency };
}

function useNowTick(intervalMs = 30_000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}

// ───────────────────────── share button

function ShareButton({ slug }: { slug: string }) {
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
      // user cancelled share — silent
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label="Share market"
      title="Share market"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-300" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ───────────────────────── id pill (copyable)

function MarketIdPill({ value }: { value: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const short = value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          /* noop */
        }
      }}
      title="Copy market ID"
      className="inline-flex items-center gap-1 rounded-md bg-white/[0.03] px-2 py-1 font-mono text-[10.5px] text-zinc-500 ring-1 ring-white/[0.06] transition hover:bg-white/[0.06] hover:text-zinc-300"
    >
      {short}
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

// ───────────────────────── exported header

function MarketDetailsHeaderInner({
  market,
  tradeMarketId,
}: {
  market: Market;
  tradeMarketId: string | null;
}) {
  useNowTick();

  const expiry = useMemo(
    () => timeUntil(market.closesAt),
    [market.closesAt],
  );
  const isOpen = market.status === "OPEN";

  return (
    <header className="space-y-1.5 border-b border-white/[0.06] pb-2.5">
      <div className="flex flex-wrap items-center gap-1.5 gap-y-2">
        <PrefetchLink
          href={ROUTES.discover}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-white/[0.04] px-2 text-[11px] font-medium text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="hidden sm:inline">Discover</span>
        </PrefetchLink>
        <ChevronRight className="h-3 w-3 text-zinc-700" aria-hidden />
        <PrefetchLink
          href={`${ROUTES.markets}?cat=${encodeURIComponent(market.category.toLowerCase())}`}
          className="rounded-md bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 ring-1 ring-white/[0.06] transition hover:bg-white/[0.08] hover:text-white"
        >
          {market.category}
        </PrefetchLink>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ring-1",
            isOpen
              ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25"
              : "bg-zinc-500/15 text-zinc-400 ring-white/10",
          )}
        >
          {isOpen ? (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/65" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
          ) : (
            <Radio className="h-2.5 w-2.5" />
          )}
          {market.status}
        </span>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] ring-1",
            expiry.urgency === "hot"
              ? "bg-rose-500/10 text-rose-300 ring-rose-400/25"
              : expiry.urgency === "warm"
                ? "bg-amber-500/10 text-amber-300 ring-amber-400/25"
                : "bg-white/[0.03] text-zinc-400 ring-white/[0.06]",
          )}
          title={`Closes ${new Date(market.closesAt).toLocaleString()}`}
        >
          <Clock className="h-2.5 w-2.5" />
          {expiry.isClosed ? "closed" : `${expiry.label} left`}
        </span>

        <span className="hidden items-center font-mono text-[10px] text-zinc-600 sm:inline-flex">
          Vol{" "}
          <span className="ml-1 text-zinc-400">{formatCompactUsd(market.volumeUsd ?? 0)}</span>
        </span>

        <div className="ml-auto flex flex-shrink-0 items-center gap-1">
          <MarketIdPill value={tradeMarketId} />
          <ShareButton slug={market.slug} />
          <WatchlistStar slug={market.slug} size="sm" />
        </div>
      </div>

      <div className="flex items-start gap-3">
        <h1 className="min-w-0 flex-1 text-balance text-base font-semibold leading-snug tracking-tight text-white sm:text-lg">
          {market.title}
        </h1>
      </div>
    </header>
  );
}

export const MarketDetailsHeader = memo(MarketDetailsHeaderInner);
