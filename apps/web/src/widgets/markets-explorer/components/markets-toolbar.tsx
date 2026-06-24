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
  liveCount?: number;
  isLoading?: boolean;
};

function useDebouncedSearch(initial: string, write: (v: string) => void) {
  const [local, setLocal] = useState(initial);
  const lastInitial = useRef(initial);

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

const hubBtn =
  "inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[11.5px] font-medium ring-1 ring-[var(--hub-border)] transition";
const hubBtnIdle =
  "bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] hover:bg-[var(--hub-primary-soft)] hover:text-[var(--hub-fg)]";

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
      className="inline-flex h-9 items-center gap-0.5 rounded-lg bg-[var(--hub-bg-subtle)] p-0.5 ring-1 ring-[var(--hub-border)]"
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
                ? "bg-[var(--hub-primary-soft)] text-[var(--hub-fg)] ring-1 ring-[var(--hub-border-strong)]"
                : "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]",
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
            hubBtn,
            active
              ? "bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-[var(--hub-border-strong)]"
              : hubBtnIdle,
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Advanced</span>
          {active ? (
            <span className="rounded bg-[var(--hub-track-bg)] px-1 font-mono text-[9px]">on</span>
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
              className={cn(selected && "bg-[var(--hub-primary-soft)]")}
            >
              <span className="flex flex-1 font-mono text-[11px] tabular-nums">{usdFloorLabel(v)}</span>
              {selected ? <Check className="h-3.5 w-3.5 text-[var(--hub-primary-bright)]" /> : null}
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
              className={cn(selected && "bg-[var(--hub-primary-soft)]")}
            >
              <span className="flex flex-1 font-mono text-[11px] tabular-nums">{usdFloorLabel(v)}</span>
              {selected ? <Check className="h-3.5 w-3.5 text-[var(--hub-primary-bright)]" /> : null}
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
        <button type="button" className={cn(hubBtn, hubBtnIdle)}>
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span className="text-[var(--hub-muted)]">Sort:</span>
          <span className="text-[var(--hub-fg)]">{current?.label ?? "Volume"}</span>
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
              className={cn(active && "bg-[var(--hub-primary-soft)]")}
            >
              <span className="flex flex-1 flex-col gap-0.5 leading-tight">
                <span className="text-[11px] font-semibold">{opt.label}</span>
                <span className="text-[9px] text-[var(--hub-muted)]">{opt.hint}</span>
              </span>
              {active ? <Check className="h-3.5 w-3.5 text-[var(--hub-primary-bright)]" /> : null}
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
          <span>Loading…</span>
        ) : (
          <>
            <span className="font-semibold text-[var(--hub-fg)]">{visibleCount}</span>
            <span className="opacity-50">/</span>
            <span>{totalCount}</span>
          </>
        )}
      </span>
      <span className="opacity-40">·</span>
      <span>markets</span>
      {liveCount && liveCount > 0 ? (
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--hub-success-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--hub-success)] ring-1 ring-[var(--hub-border)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--hub-success)]/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--hub-success)]" />
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
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(local);
        }}
        className={cn(
          "group relative flex h-9 min-w-0 flex-1 items-center rounded-lg bg-[var(--hub-bg-subtle)] ring-1 ring-[var(--hub-border)] transition",
          "focus-within:bg-[var(--hub-card)] focus-within:ring-[var(--hub-border-strong)]",
          "hover:bg-[var(--hub-card)]",
        )}
      >
        <Search className="ml-2.5 h-3.5 w-3.5 shrink-0 text-[var(--hub-muted)] transition group-focus-within:text-[var(--hub-primary-bright)]" />
        <input
          ref={inputRef}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Search markets, tickers, narratives…"
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-[12.5px] font-medium text-[var(--hub-fg)] placeholder:text-[var(--hub-muted)] focus:outline-none"
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
            className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded text-[var(--hub-muted)] transition hover:bg-[var(--hub-primary-soft)] hover:text-[var(--hub-fg)]"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <kbd className="mr-2 hidden h-5 select-none items-center gap-0.5 rounded border border-[var(--hub-border)] bg-[var(--hub-track-bg)] px-1.5 font-mono text-[9.5px] font-medium text-[var(--hub-muted)] sm:inline-flex">
            ⌘K
          </kbd>
        )}
      </form>

      <motion.button
        type="button"
        onClick={toggleTrending}
        whileTap={{ scale: 0.97 }}
        aria-pressed={trending}
        title="Pin markets with recent fills to the top"
        className={cn(
          hubBtn,
          trending
            ? "bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-[var(--hub-border-strong)]"
            : hubBtnIdle,
        )}
      >
        <Flame className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Live first</span>
        <span className="sm:hidden">Live</span>
      </motion.button>

      <AdvancedFiltersMenu />
      <SortMenu value={sort} onChange={setSort} />

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
