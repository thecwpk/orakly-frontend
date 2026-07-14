"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { apiClient } from "@/api/client/http-client";
import { formatUsdCompact } from "@/lib/format-usd";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { useDebouncedValue } from "@/shared/api/hooks";
import { unwrapApiResult } from "@/shared/api/unwrap";
import { LeaderboardAvatar } from "@/features/leaderboard/components/leaderboard-avatar";
import { WatchlistStar } from "@/features/watchlist";
import { pushRecentSearch, readRecentSearches } from "../lib/recent-searches";
import { useGlobalSearchStore } from "../store/use-global-search-store";

type SearchMarketHit = {
  id: string;
  slug: string;
  question: string;
  category: string | null;
  probability: number;
  volume: number;
};

type SearchNarrativeHit = {
  slug: string;
  name: string;
  attentionScore: number;
  momentum: string;
};

type SearchCreatorHit = {
  address: string;
  approvedMarkets: number;
  creatorRank: number | null;
};

type SearchWalletHit = {
  address: string;
  winRatePct: number;
};

type SearchPayload = {
  markets: SearchMarketHit[];
  narratives: SearchNarrativeHit[];
  creators: SearchCreatorHit[];
  wallets: SearchWalletHit[];
};

type PopularMarket = {
  id?: string;
  slug: string;
  question: string;
  category: string | null;
  probability: number;
  volume: number;
};

const EMPTY: SearchPayload = {
  markets: [],
  narratives: [],
  creators: [],
  wallets: [],
};

function looksLikeWallet(q: string): boolean {
  return q.startsWith("0x") && q.length >= 10;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function probabilityPct(p: number): number {
  const n = p > 1 ? p : p * 100;
  return Math.round(Math.max(0, Math.min(100, n)));
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-11 animate-pulse rounded-xl bg-white/[0.04] ring-1 ring-white/[0.04]"
        />
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
      {children}
    </p>
  );
}

/**
 * Full-screen global search overlay — Cmd/Ctrl+K or topbar Search icon.
 */
export function GlobalSearch() {
  const isOpen = useGlobalSearchStore((s) => s.isOpen);
  const open = useGlobalSearchStore((s) => s.open);
  const close = useGlobalSearchStore((s) => s.close);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  const [results, setResults] = useState<SearchPayload>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [popular, setPopular] = useState<PopularMarket[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setResults(EMPTY);
    setRecent(readRecentSearches());
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const q = debounced.trim();
    if (!q) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const types = looksLikeWallet(q)
      ? "markets,narratives,creators,wallets"
      : "markets,narratives,creators";

    void (async () => {
      const res = await apiClient.request<SearchPayload>(
        `/api/v1/search?q=${encodeURIComponent(q)}&types=${types}`,
      );
      if (cancelled) return;
      try {
        setResults(unwrapApiResult(res));
      } catch {
        setResults(EMPTY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (recent.length > 0) return;
    let cancelled = false;
    setPopularLoading(true);
    void (async () => {
      const qs = new URLSearchParams({
        scope: "hub",
        lane: "trending",
        trendingBy: "volume",
        take: "5",
        limit: "5",
        sort: "volume",
      });
      const res = await apiClient.request<
        Array<{
          id?: string;
          slug: string;
          title: string;
          category?: string;
          probability?: number;
          volumeUsd?: number;
        }>
      >(`/api/v1/markets?${qs.toString()}`);
      if (cancelled) return;
      try {
        const rows = unwrapApiResult(res);
        setPopular(
          (Array.isArray(rows) ? rows : [])
            .slice(0, 5)
            .map((row) => ({
              id: "id" in row && typeof row.id === "string" ? row.id : undefined,
              slug: row.slug,
              question: row.title,
              category: row.category ?? null,
              probability: row.probability ?? 0.5,
              volume: row.volumeUsd ?? 0,
            }))
            .filter((m) => Boolean(m.slug)),
        );
      } catch {
        setPopular([]);
      } finally {
        if (!cancelled) setPopularLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, recent.length]);

  const navigate = useCallback(
    (href: string, searchToRemember?: string) => {
      if (searchToRemember?.trim()) {
        setRecent(pushRecentSearch(searchToRemember.trim()));
      } else if (query.trim()) {
        setRecent(pushRecentSearch(query.trim()));
      }
      close();
      router.push(href);
    },
    [close, query, router],
  );

  const q = query.trim();
  const showEmptyState = !q;
  const hasResults =
    results.markets.length > 0 ||
    results.narratives.length > 0 ||
    results.creators.length > 0 ||
    results.wallets.length > 0;
  const showNoResults = Boolean(q) && !loading && debounced.trim() === q && !hasResults;

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center px-3 pb-8 pt-[min(12vh,5rem)] sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.button
            type="button"
            aria-label="Close search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={close}
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={cn(
              "relative z-[1] flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl",
              "border border-white/[0.08] bg-[#12141c] text-zinc-100",
            )}
          >
            <h2 id={titleId} className="sr-only">
              Global search
            </h2>

            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-3 sm:px-4">
              <Search className="size-5 shrink-0 text-zinc-500" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search markets, narratives, creators, wallets..."
                className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-zinc-50 placeholder:text-zinc-500 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
                aria-label="Search"
              />
              <kbd className="hidden shrink-0 rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:inline">
                Esc
              </kbd>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-100"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[min(68vh,560px)] overflow-y-auto px-3 py-3 sm:px-4">
              {showEmptyState ? (
                recent.length > 0 ? (
                  <div>
                    <SectionLabel>Recent searches</SectionLabel>
                    <ul className="space-y-1">
                      {recent.map((item) => (
                        <li key={item}>
                          <button
                            type="button"
                            onClick={() => setQuery(item)}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-[13px] text-zinc-200 transition hover:bg-white/[0.05]"
                          >
                            <Clock className="size-3.5 shrink-0 text-zinc-500" />
                            <span className="truncate">{item}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : popularLoading ? (
                  <div>
                    <SectionLabel>Popular markets</SectionLabel>
                    <SkeletonRows count={5} />
                  </div>
                ) : popular.length > 0 ? (
                  <div>
                    <SectionLabel>Popular markets</SectionLabel>
                    <ul className="space-y-1">
                      {popular.map((m) => (
                        <li key={m.slug}>
                          <MarketRow
                            market={m}
                            onSelect={() => navigate(ROUTES.market(m.slug), m.question)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="px-1 py-6 text-center text-[13px] text-zinc-500">
                    Start typing to search markets, narratives, creators, and wallets.
                  </p>
                )
              ) : loading ? (
                <div className="space-y-5">
                  <div>
                    <SectionLabel>Markets</SectionLabel>
                    <SkeletonRows count={3} />
                  </div>
                  <div>
                    <SectionLabel>Narratives</SectionLabel>
                    <SkeletonRows count={2} />
                  </div>
                  <div>
                    <SectionLabel>Creators</SectionLabel>
                    <SkeletonRows count={2} />
                  </div>
                </div>
              ) : showNoResults ? (
                <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                  <p className="text-[14px] text-zinc-300">
                    No results for &ldquo;{q}&rdquo;
                  </p>
                  <Link
                    href={ROUTES.markets}
                    onClick={() => close()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-[13px] font-medium text-zinc-100 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
                  >
                    Browse markets
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {results.markets.length > 0 ? (
                    <div>
                      <SectionLabel>Markets</SectionLabel>
                      <ul className="space-y-1">
                        {results.markets.map((m) => (
                          <li key={m.slug}>
                            <MarketRow
                              market={m}
                              onSelect={() => navigate(ROUTES.market(m.slug))}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {results.narratives.length > 0 ? (
                    <div>
                      <SectionLabel>Narratives</SectionLabel>
                      <ul className="space-y-1">
                        {results.narratives.map((n) => (
                          <li key={n.slug}>
                            <button
                              type="button"
                              onClick={() => navigate(`/narratives/${n.slug}`)}
                              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/[0.05]"
                            >
                              <TrendingUp className="size-4 shrink-0 text-cyan-300/90" />
                              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-zinc-100">
                                {n.name}
                              </span>
                              <span className="font-mono text-[11px] tabular-nums text-zinc-400">
                                {Math.round(n.attentionScore)}
                              </span>
                              <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400 ring-1 ring-white/[0.06]">
                                {n.momentum}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {results.creators.length > 0 ? (
                    <div>
                      <SectionLabel>Creators</SectionLabel>
                      <ul className="space-y-1">
                        {results.creators.map((c) => (
                          <li key={c.address}>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(ROUTES.traderProfile(c.address))
                              }
                              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/[0.05]"
                            >
                              <LeaderboardAvatar address={c.address} className="h-8 w-8" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-mono text-[12.5px] font-medium text-zinc-100">
                                  {shortenAddress(c.address)}
                                </span>
                                <span className="text-[11px] text-zinc-500">
                                  {c.approvedMarkets} approved markets
                                </span>
                              </span>
                              {c.creatorRank != null ? (
                                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-200 ring-1 ring-amber-400/20">
                                  #{c.creatorRank}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {results.wallets.length > 0 ? (
                    <div>
                      <SectionLabel>Wallets</SectionLabel>
                      <ul className="space-y-1">
                        {results.wallets.map((w) => (
                          <li key={w.address}>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(ROUTES.traderProfile(w.address))
                              }
                              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/[0.05]"
                            >
                              <LeaderboardAvatar address={w.address} className="h-8 w-8 rounded-full" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-mono text-[11.5px] text-zinc-100">
                                  {w.address}
                                </span>
                                <span className="text-[11px] text-zinc-500">Trader</span>
                              </span>
                              <span className="font-mono text-[11px] tabular-nums text-emerald-300/90">
                                {w.winRatePct}% WR
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function MarketRow({
  market,
  onSelect,
}: {
  market: SearchMarketHit | PopularMarket;
  onSelect: () => void;
}) {
  const pct = probabilityPct(market.probability);
  const marketId = "id" in market && market.id ? market.id : "";
  return (
    <div className="flex w-full items-center gap-1 rounded-xl pr-1 transition hover:bg-white/[0.05]">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2.5 text-left"
      >
        <span
          className={cn(
            "inline-flex h-7 min-w-[2.75rem] shrink-0 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-semibold tabular-nums ring-1",
            pct >= 50
              ? "bg-emerald-500/12 text-emerald-300 ring-emerald-400/25"
              : "bg-rose-500/12 text-rose-300 ring-rose-400/25",
          )}
        >
          {pct}%
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-zinc-100">
          {truncate(market.question, 60)}
        </span>
        {market.category ? (
          <span className="hidden shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-white/[0.06] sm:inline">
            {market.category}
          </span>
        ) : null}
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-500">
          {formatUsdCompact(market.volume)}
        </span>
      </button>
      {marketId ? <WatchlistStar id={marketId} size="xs" /> : null}
    </div>
  );
}
