"use client";

import { motion } from "framer-motion";
import {
  ArrowUpDown,
  Check,
  Flame,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MARKETS_SORT_OPTIONS,
  useMarketsFilterStore,
  type MarketsSort,
  type MarketsViewMode,
} from "@/features/markets/store/use-markets-filter-store";
import { cn } from "@/lib/utils";

type Props = {
  totalCount: number;
  visibleCount: number;
  /** Number of markets currently flagged as "live". */
  liveCount?: number;
  isLoading?: boolean;
};

/** Debounce a Zustand store write so typing doesn't thrash filter recompute. */
function useDebouncedSearch(initial: string, write: (v: string) => void) {
  const [local, setLocal] = useState(initial);
  const lastInitial = useRef(initial);

  // External (URL/store) changes should sync into the local input.
  useEffect(() => {
    if (lastInitial.current !== initial) {
      setLocal(initial);
      lastInitial.current = initial;
    }
  }, [initial]);

  useEffect(() => {
    if (local === initial) return;
    const id = window.setTimeout(() => write(local), 180);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return [local, setLocal] as const;
}

function ViewToggle({
  value,
  onChange,
}: {
  value: MarketsViewMode;
  onChange: (next: MarketsViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="inline-flex h-9 items-center gap-0.5 rounded-lg bg-black/30 p-0.5 ring-1 ring-white/[0.06]"
    >
      {(
        [
          { id: "grid", icon: LayoutGrid, label: "Grid" },
          { id: "list", icon: List, label: "Dense list" },
        ] as const
      ).map((opt) => {
        const active = value === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative inline-flex h-8 w-8 items-center justify-center rounded-md transition",
              active
                ? "bg-white/[0.08] text-white ring-1 ring-cyan-400/30"
                : "text-zinc-500 hover:text-zinc-200",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

const LIQUIDITY_PRESETS = [0, 25_000, 100_000, 500_000] as const;
const VOLUME_PRESETS = [0, 50_000, 250_000, 1_000_000] as const;

function usdFloorLabel(n: number): string {
  if (n <= 0) return "Any";
  if (n >= 1_000_000) return `$${n / 1_000_000}M+`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k+`;
  return `$${n}+`;
}

function AdvancedFiltersMenu() {
  const minLiquidityUsd = useMarketsFilterStore((s) => s.minLiquidityUsd);
  const minVolumeUsd = useMarketsFilterStore((s) => s.minVolumeUsd);
  const setMinLiquidityUsd = useMarketsFilterStore((s) => s.setMinLiquidityUsd);
  const setMinVolumeUsd = useMarketsFilterStore((s) => s.setMinVolumeUsd);

  const active = minLiquidityUsd > 0 || minVolumeUsd > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Liquidity & volume floors"
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-[11.5px] font-medium ring-1 transition",
            active
              ? "bg-cyan-500/12 text-cyan-100 ring-cyan-400/35 hover:bg-cyan-500/18"
              : "bg-white/[0.04] text-zinc-300 ring-white/[0.08] hover:bg-white/[0.08] hover:text-zinc-100",
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Advanced</span>
          {active ? (
            <span className="rounded bg-black/30 px-1 font-mono text-[9px] text-cyan-200/90">
              on
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-[min(100vw-2rem,17rem)]">
        <DropdownMenuLabel>Liquidity floor</DropdownMenuLabel>
        {LIQUIDITY_PRESETS.map((v) => {
          const selected = minLiquidityUsd === v;
          return (
            <DropdownMenuItem
              key={`liq-${v}`}
              onSelect={() => setMinLiquidityUsd(v)}
              className={cn(selected && "bg-white/[0.05]")}
            >
              <span className="flex flex-1 font-mono text-[11px] tabular-nums text-zinc-200">
                {usdFloorLabel(v)}
              </span>
              {selected ? <Check className="h-3.5 w-3.5 text-cyan-300" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Volume floor</DropdownMenuLabel>
        {VOLUME_PRESETS.map((v) => {
          const selected = minVolumeUsd === v;
          return (
            <DropdownMenuItem
              key={`vol-${v}`}
              onSelect={() => setMinVolumeUsd(v)}
              className={cn(selected && "bg-white/[0.05]")}
            >
              <span className="flex flex-1 font-mono text-[11px] tabular-nums text-zinc-200">
                {usdFloorLabel(v)}
              </span>
              {selected ? <Check className="h-3.5 w-3.5 text-cyan-300" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortMenu({
  value,
  onChange,
}: {
  value: MarketsSort;
  onChange: (next: MarketsSort) => void;
}) {
  const current = MARKETS_SORT_OPTIONS.find((o) => o.id === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 text-[11.5px] font-medium text-zinc-200 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-zinc-500">Sort:</span>
          <span className="text-zinc-100">{current?.label ?? "Volume"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[13.5rem]">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MARKETS_SORT_OPTIONS.map((opt) => {
          const active = opt.id === value;
          return (
            <DropdownMenuItem
              key={opt.id}
              onSelect={() => onChange(opt.id)}
              className={cn(active && "bg-white/[0.05]")}
            >
              <span className="flex flex-1 flex-col gap-0.5 leading-tight">
                <span className="text-[11px] font-semibold text-zinc-100">{opt.label}</span>
                <span className="text-[9px] text-zinc-500">{opt.hint}</span>
              </span>
              {active ? (
                <Check className="h-3.5 w-3.5 text-cyan-300" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ResultPill({
  visibleCount,
  totalCount,
  liveCount,
  isLoading,
}: {
  visibleCount: number;
  totalCount: number;
  liveCount?: number;
  isLoading?: boolean;
}) {
  return (
    <div className="hidden items-center gap-2 text-[11px] text-[var(--hub-muted)] sm:flex">
      <span className="font-mono tabular-nums">
        {isLoading ? (
          <span className="text-[var(--hub-muted)]">Loading…</span>
        ) : (
          <>
            <span className="font-semibold text-[var(--hub-fg)]">{visibleCount}</span>
            <span className="text-[var(--hub-muted)]/60">/</span>
            <span>{totalCount}</span>
          </>
        )}
      </span>
      <span className="text-zinc-700">·</span>
      <span>markets</span>
      {liveCount && liveCount > 0 ? (
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-400/25">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {liveCount} live
        </span>
      ) : null}
    </div>
  );
}

export function MarketsToolbar({
  totalCount,
  visibleCount,
  liveCount,
  isLoading,
}: Props) {
  const search = useMarketsFilterStore((s) => s.searchTerm);
  const setSearch = useMarketsFilterStore((s) => s.setSearchTerm);
  const sort = useMarketsFilterStore((s) => s.sort);
  const setSort = useMarketsFilterStore((s) => s.setSort);
  const trending = useMarketsFilterStore((s) => s.trendingOnly);
  const toggleTrending = useMarketsFilterStore((s) => s.toggleTrendingOnly);
  const viewMode = useMarketsFilterStore((s) => s.viewMode);
  const setViewMode = useMarketsFilterStore((s) => s.setViewMode);

  const inputRef = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useDebouncedSearch(search, setSearch);

  // ⌘K / Ctrl+K focuses the toolbar search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2.5">
      {/* search */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(local);
        }}
        className={cn(
          "group relative flex h-9 min-w-0 flex-1 items-center rounded-lg bg-white/[0.04] ring-1 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] transition",
          "focus-within:bg-white/[0.07] focus-within:shadow-[0_0_28px_-10px_rgba(34,211,238,0.4)] focus-within:ring-cyan-400/35",
          "ring-white/[0.06] hover:bg-white/[0.06]",
        )}
      >
        <Search className="ml-2.5 h-3.5 w-3.5 shrink-0 text-zinc-500 transition group-focus-within:text-cyan-300" />
        <input
          ref={inputRef}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Search markets, tickers, narratives…"
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-[12.5px] font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search markets"
        />
        {local ? (
          <button
            type="button"
            onClick={() => {
              setLocal("");
              setSearch("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <kbd className="mr-2 hidden h-5 select-none items-center gap-0.5 rounded border border-white/10 bg-black/30 px-1.5 font-mono text-[9.5px] font-medium text-zinc-500 sm:inline-flex">
            ⌘K
          </kbd>
        )}
      </form>

      {/* trending toggle */}
      <motion.button
        type="button"
        onClick={toggleTrending}
        whileTap={{ scale: 0.97 }}
        aria-pressed={trending}
          className={cn(
          "inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[11.5px] font-medium ring-1 transition",
          trending
            ? "bg-rose-500/15 text-rose-200 ring-rose-400/30 hover:bg-rose-500/20"
            : "bg-white/[0.04] text-zinc-300 ring-white/[0.08] hover:bg-white/[0.08] hover:text-zinc-100",
        )}
      >
        <Flame className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Trending only</span>
        <span className="sm:hidden">Tape</span>
      </motion.button>

      <AdvancedFiltersMenu />

      {/* sort */}
      <SortMenu value={sort} onChange={setSort} />

      {/* view + result count */}
      <div className="flex items-center gap-2">
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <ResultPill
          visibleCount={visibleCount}
          totalCount={totalCount}
          liveCount={liveCount}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
