"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MarketCard } from "@/features/markets/components/market-card";
import { MarketCardSkeleton } from "@/features/markets/components/market-card-skeleton";
import { cn } from "@/lib/utils";
import { fetchAttentionDashboard } from "@/shared/api/fetchers/attention-dashboard";
import { fetchMarketsExplorer } from "@/shared/api/fetchers/markets-explorer";
import { queryKeys } from "@/shared/api/query-keys";
import type { MarketsExplorerSort } from "@/shared/contracts/markets-explorer";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 400;

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "Meme", label: "Meme" },
  { value: "DeFi", label: "DeFi" },
  { value: "Layer1", label: "Layer1" },
  { value: "Layer2", label: "Layer2" },
  { value: "AI", label: "AI" },
  { value: "Other", label: "Other" },
] as const;

const STATUSES = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "PENDING", label: "Pending" },
  { value: "PAUSED", label: "Paused" },
] as const;

const SORTS: { id: MarketsExplorerSort; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "volume", label: "Highest Volume" },
  { id: "newest", label: "Newest" },
  { id: "ending", label: "Ending Soon" },
  { id: "discussed", label: "Most Discussed" },
];

type FilterState = {
  q: string;
  category: string;
  status: string;
  narrative: string;
  creator: string;
  dateFrom: string;
  dateTo: string;
  minVolume: string;
  maxVolume: string;
  minProbability: string;
  maxProbability: string;
  sort: MarketsExplorerSort;
  page: number;
};

function filtersFromSearchParams(sp: URLSearchParams): FilterState {
  const sortRaw = sp.get("sort")?.trim() ?? "trending";
  const sort = (
    SORTS.some((s) => s.id === sortRaw) ? sortRaw : "trending"
  ) as MarketsExplorerSort;
  const pageRaw = Number.parseInt(sp.get("page") ?? "1", 10);
  return {
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    status: sp.get("status") ?? "",
    narrative: sp.get("narrative") ?? "",
    creator: sp.get("creator") ?? "",
    dateFrom: sp.get("dateFrom") ?? "",
    dateTo: sp.get("dateTo") ?? "",
    minVolume: sp.get("minVolume") ?? "",
    maxVolume: sp.get("maxVolume") ?? "",
    minProbability: sp.get("minProbability") ?? "0",
    maxProbability: sp.get("maxProbability") ?? "100",
    sort,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

function buildQueryString(f: FilterState): string {
  const sp = new URLSearchParams();
  sp.set("page", String(f.page));
  sp.set("limit", String(PAGE_SIZE));
  sp.set("sort", f.sort);
  if (f.q.trim()) sp.set("q", f.q.trim());
  if (f.category) sp.set("category", f.category);
  if (f.status) sp.set("status", f.status);
  if (f.narrative) sp.set("narrative", f.narrative);
  if (f.creator.trim()) sp.set("creator", f.creator.trim());
  if (f.dateFrom) sp.set("dateFrom", f.dateFrom);
  if (f.dateTo) sp.set("dateTo", f.dateTo);
  if (f.minVolume !== "") sp.set("minVolume", f.minVolume);
  if (f.maxVolume !== "") sp.set("maxVolume", f.maxVolume);
  const minP = f.minProbability === "" ? "0" : f.minProbability;
  const maxP = f.maxProbability === "" ? "100" : f.maxProbability;
  if (minP !== "0") sp.set("minProbability", minP);
  if (maxP !== "100") sp.set("maxProbability", maxP);
  return sp.toString();
}

function defaultFilters(): FilterState {
  return {
    q: "",
    category: "",
    status: "",
    narrative: "",
    creator: "",
    dateFrom: "",
    dateTo: "",
    minVolume: "",
    maxVolume: "",
    minProbability: "0",
    maxProbability: "100",
    sort: "trending",
    page: 1,
  };
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const out: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) out.push(i);
      return out;
    }
    out.push(1);
    if (page > 3) out.push("…");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) out.push(i);
    if (page < totalPages - 2) out.push("…");
    out.push(totalPages);
    return out;
  }, [page, totalPages]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-zinc-300 ring-1 ring-white/10 transition enabled:hover:bg-white/[0.06] disabled:opacity-40"
      >
        Previous
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-1 text-zinc-500">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={cn(
              "min-w-8 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition",
              p === page
                ? "bg-blue-600 text-white"
                : "text-zinc-300 ring-1 ring-white/10 hover:bg-white/[0.06]",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-zinc-300 ring-1 ring-white/10 transition enabled:hover:bg-white/[0.06] disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

export function MarketsExplorerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlFilters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(urlFilters.q);
  const [creatorInput, setCreatorInput] = useState(urlFilters.creator);
  const [local, setLocal] = useState<FilterState>(urlFilters);

  useEffect(() => {
    setSearchInput(urlFilters.q);
    setCreatorInput(urlFilters.creator);
    setLocal(urlFilters);
  }, [urlFilters]);

  const pushFilters = useCallback(
    (next: FilterState) => {
      const qs = buildQueryString(next);
      router.replace(`/markets?${qs}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchInput === urlFilters.q) return;
      pushFilters({ ...urlFilters, q: searchInput, page: 1 });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchInput, urlFilters, pushFilters]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (creatorInput === urlFilters.creator) return;
      pushFilters({ ...urlFilters, creator: creatorInput, page: 1 });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [creatorInput, urlFilters, pushFilters]);

  const patch = useCallback(
    (partial: Partial<FilterState>) => {
      const next = { ...urlFilters, ...partial, page: partial.page ?? 1 };
      if (partial.page != null) next.page = partial.page;
      setLocal(next);
      pushFilters(next);
    },
    [urlFilters, pushFilters],
  );

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setCreatorInput("");
    const next = defaultFilters();
    setLocal(next);
    pushFilters(next);
  }, [pushFilters]);

  const queryParams = useMemo(
    () => ({
      q: urlFilters.q.trim() || undefined,
      category: urlFilters.category || undefined,
      status: urlFilters.status || undefined,
      narrative: urlFilters.narrative || undefined,
      creator: urlFilters.creator.trim() || undefined,
      dateFrom: urlFilters.dateFrom || undefined,
      dateTo: urlFilters.dateTo || undefined,
      minVolume: urlFilters.minVolume !== "" ? Number(urlFilters.minVolume) : undefined,
      maxVolume: urlFilters.maxVolume !== "" ? Number(urlFilters.maxVolume) : undefined,
      minProbability:
        urlFilters.minProbability !== "" && urlFilters.minProbability !== "0"
          ? Number(urlFilters.minProbability)
          : urlFilters.minProbability === "0"
            ? 0
            : undefined,
      maxProbability:
        urlFilters.maxProbability !== "" && urlFilters.maxProbability !== "100"
          ? Number(urlFilters.maxProbability)
          : undefined,
      sort: urlFilters.sort,
      page: urlFilters.page,
      limit: PAGE_SIZE,
    }),
    [urlFilters],
  );

  const paramsKey = useMemo(() => JSON.stringify(queryParams), [queryParams]);

  const marketsQuery = useQuery({
    queryKey: queryKeys.markets.explorer(paramsKey),
    queryFn: () => fetchMarketsExplorer(queryParams),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });

  const narrativesQuery = useQuery({
    queryKey: queryKeys.hub.attentionDashboard(50),
    queryFn: () => fetchAttentionDashboard(50),
    staleTime: 60_000,
  });

  const narrativeOptions = useMemo(() => {
    const items = narrativesQuery.data?.data ?? [];
    const names = [
      ...new Set(
        items
          .map((r) => r.narrativeName?.trim())
          .filter((n): n is string => Boolean(n)),
      ),
    ].sort((a, b) => a.localeCompare(b));
    return names;
  }, [narrativesQuery.data]);

  const result = marketsQuery.data;
  const markets = result?.markets ?? [];
  const total = result?.total ?? 0;
  const page = result?.page ?? urlFilters.page;
  const totalPages = result?.totalPages ?? 1;
  const loading = marketsQuery.isLoading && !result;

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const selectClass =
    "rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-2 text-[13px] text-zinc-200 outline-none focus:border-blue-500/50";
  const inputClass =
    "rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-2 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-blue-500/50";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="text-[32px] font-bold tracking-tight text-zinc-50">Markets</h1>
        <p className="mt-1 text-[15px] text-zinc-400">Every prediction market on Orakly</p>
      </header>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search markets..."
          className="w-full rounded-xl border border-white/10 bg-zinc-900/80 py-3 pl-10 pr-4 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500/50"
          aria-label="Search markets"
        />
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[11px] font-medium text-zinc-500">
          Category
          <select
            className={selectClass}
            value={local.category}
            onChange={(e) => patch({ category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value || "all"} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-zinc-500">
          Status
          <select
            className={selectClass}
            value={local.status}
            onChange={(e) => patch({ status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s.value || "all"} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-zinc-500">
          Narrative
          <select
            className={cn(selectClass, "min-w-[140px]")}
            value={local.narrative}
            onChange={(e) => patch({ narrative: e.target.value })}
          >
            <option value="">All Narratives</option>
            {narrativeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-[11px] font-medium text-zinc-500">
          Creator
          <input
            type="text"
            value={creatorInput}
            onChange={(e) => setCreatorInput(e.target.value)}
            placeholder="Creator address..."
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-zinc-500">
          From
          <input
            type="date"
            value={local.dateFrom}
            onChange={(e) => patch({ dateFrom: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-zinc-500">
          To
          <input
            type="date"
            value={local.dateTo}
            onChange={(e) => patch({ dateTo: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-zinc-500">
          Min $
          <input
            type="number"
            min={0}
            value={local.minVolume}
            onChange={(e) => patch({ minVolume: e.target.value })}
            placeholder="0"
            className={cn(inputClass, "w-24")}
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-zinc-500">
          Max $
          <input
            type="number"
            min={0}
            value={local.maxVolume}
            onChange={(e) => patch({ maxVolume: e.target.value })}
            placeholder="—"
            className={cn(inputClass, "w-24")}
          />
        </label>

        <div className="flex min-w-[200px] flex-1 flex-col gap-1 text-[11px] font-medium text-zinc-500">
          <span>
            Probability ({local.minProbability || 0}% — {local.maxProbability || 100}%)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={Number(local.minProbability) || 0}
              onChange={(e) => {
                const min = Number(e.target.value);
                const max = Number(local.maxProbability) || 100;
                patch({
                  minProbability: String(min),
                  maxProbability: String(Math.max(min, max)),
                });
              }}
              className="w-full accent-blue-500"
              aria-label="Minimum yes probability"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={Number(local.maxProbability) || 100}
              onChange={(e) => {
                const max = Number(e.target.value);
                const min = Number(local.minProbability) || 0;
                patch({
                  maxProbability: String(max),
                  minProbability: String(Math.min(min, max)),
                });
              }}
              className="w-full accent-blue-500"
              aria-label="Maximum yes probability"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="mb-0.5 text-[13px] font-medium text-blue-400 underline-offset-2 hover:underline"
        >
          Reset filters
        </button>
      </div>

      {/* Sort */}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Sort markets">
        {SORTS.map((s) => {
          const active = urlFilters.sort === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => patch({ sort: s.id })}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
                active
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 ring-1 ring-white/10 hover:bg-white/[0.06] hover:text-zinc-200",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} index={i} />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
          <p className="text-[15px] text-zinc-400">
            No markets found matching your filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {markets.map((m, index) => (
            <MarketCard
              key={m.id}
              market={m}
              index={index}
              isLive={m.status === "OPEN"}
              narrative={m.narrative}
              participants={m.participants}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > 0 ? (
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-[13px] text-zinc-500">
            Showing {from}-{to} of {total} markets
          </p>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPage={(p) => patch({ page: p })}
          />
        </div>
      ) : null}
    </div>
  );
}
