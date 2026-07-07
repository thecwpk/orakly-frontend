"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronDown, Pause, Radio, RefreshCcw } from "lucide-react";
import { memo } from "react";
import { useActivityFeed } from "./hooks/use-activity-feed";
import { ActivityFilterTabs } from "./components/activity-filter-tabs";
import { ActivityRow } from "./components/activity-row";
import { ActivitySkeleton } from "./components/activity-skeleton";
import { useNowTick } from "./lib/time";
import type { ActivityFilter } from "./lib/types";
import { cn } from "@/lib/utils";

export type RealtimeActivityFeedProps = {
  /** Title for the panel header. Pass `null` to hide the entire header. */
  title?: string | null;
  /** Subtitle / eyebrow shown above the title. */
  eyebrow?: string;
  /** Single-market scope (slug | display id | backend uuid). */
  marketScope?: string;
  /** Hard cap on rendered rows. */
  maxRows?: number;
  /** Compact density (smaller paddings, smaller text). */
  compact?: boolean;
  /** Initial filter tab. */
  defaultFilter?: ActivityFilter;
  /** When `true`, the filter tabs are rendered in the header. */
  showFilterTabs?: boolean;
  /** CSS height for the scroll container — set to a fixed value to enable
   *  internal scroll. Defaults to `'420px'`. Pass `'auto'` to grow with content. */
  height?: string;
  className?: string;
};

const STATUS_FALLBACK = {
  dot: "bg-zinc-500",
  label: "Offline",
} as const;

const STATUS_TONE: Record<string, { dot: string; label: string }> = {
  connected: {
    dot: "bg-emerald-400 shadow-[0_0_10px_2px_rgba(16,185,129,0.45)]",
    label: "Live",
  },
  connecting: {
    dot: "bg-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.45)] animate-pulse",
    label: "Connecting",
  },
  disconnected: STATUS_FALLBACK,
  error: {
    dot: "bg-rose-400 shadow-[0_0_10px_2px_rgba(244,63,94,0.45)]",
    label: "Error",
  },
};

function RealtimeActivityFeedImpl({
  title = "Live activity",
  eyebrow = "Tape",
  marketScope,
  maxRows = 60,
  compact = false,
  defaultFilter = "all",
  showFilterTabs = true,
  height = "420px",
  className,
}: RealtimeActivityFeedProps) {
  const {
    filter,
    setFilter,
    rows,
    counts,
    connection,
    pendingCount,
    resume,
    scrollHandlers,
  } = useActivityFeed({ marketScope, maxRows, defaultFilter });

  const now = useNowTick(10_000);
  const status = STATUS_TONE[connection] ?? STATUS_FALLBACK;
  const showHeader = title !== null;

  const isEmpty = rows.length === 0;

  return (
    <section
      aria-label="Realtime activity"
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#0a0a12]/85 ring-1 ring-[var(--hub-border)] supports-[backdrop-filter]:backdrop-blur",
        className,
      )}
    >
      {/* ambient glow on top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
      />

      {showHeader ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hub-border)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 text-[var(--hub-primary-bright)] ring-1 ring-cyan-400/25">
              <Activity className="h-3.5 w-3.5" />
            </span>
            <div className="leading-tight">
              {eyebrow ? (
                <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[var(--hub-muted)]">
                  {eyebrow}
                </p>
              ) : null}
              <p className="text-[13px] font-semibold text-[var(--hub-fg)]">{title}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showFilterTabs ? (
              <ActivityFilterTabs
                active={filter}
                counts={counts}
                onChange={setFilter}
              />
            ) : null}
            <span
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--hub-bg-subtle)] px-1.5 py-1 text-[10px] font-medium text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)]"
              aria-live="polite"
            >
              <Radio className="h-2.5 w-2.5 text-[var(--hub-muted)]" />
              <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
              <span>{status.label}</span>
            </span>
          </div>
        </header>
      ) : null}

      {/* Pending pill — appears when paused with new rows queued */}
      <AnimatePresence>
        {pendingCount > 0 ? (
          <motion.button
            key="pending"
            type="button"
            onClick={resume}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5",
              "rounded-full bg-cyan-500/15 px-2.5 py-1 text-[11px] font-semibold text-[var(--hub-fg)]",
              "ring-1 ring-[var(--hub-border-strong)] shadow-[0_4px_24px_-6px_rgba(34,211,238,0.4)] backdrop-blur",
              "hover:bg-cyan-500/20",
              showHeader ? "top-[58px]" : "top-2",
            )}
            aria-label={`Show ${pendingCount} new activities`}
          >
            <RefreshCcw className="h-3 w-3" />
            <span>
              <span className="font-mono tabular-nums">{pendingCount}</span> new
            </span>
            <ChevronDown className="h-3 w-3" />
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* Scroll surface */}
      <div
        {...scrollHandlers}
        style={height === "auto" ? undefined : { maxHeight: height }}
        className={cn(
          "relative overflow-y-auto overscroll-contain",
          "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]",
          height !== "auto" && "min-h-[160px]",
        )}
      >
        {isEmpty ? (
          rows.length === 0 && counts.all === 0 ? (
            <ActivitySkeleton count={compact ? 5 : 7} compact={compact} />
          ) : (
            <EmptyState filter={filter} marketScope={marketScope} />
          )
        ) : (
          <motion.ol
            layout
            className="divide-y divide-[var(--hub-border)]"
          >
            <AnimatePresence initial={false}>
              {rows.map((row) => (
                <ActivityRow key={row.id} row={row} now={now} compact={compact} />
              ))}
            </AnimatePresence>
          </motion.ol>
        )}

        {/* Soft fade at the bottom hints there's more */}
        {!isEmpty ? (
          <div
            aria-hidden
            className="pointer-events-none sticky bottom-0 h-12 w-full bg-gradient-to-t from-[#0a0a12] to-transparent"
          />
        ) : null}
      </div>

      {/* Footer hint when paused */}
      <AnimatePresence>
        {pendingCount > 0 ? null : connection === "connected" ? null : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 border-t border-white/[0.05] px-4 py-2 text-[10.5px] text-[var(--hub-muted)]"
          >
            <Pause className="h-3 w-3" />
            <span>
              {connection === "connecting"
                ? "Reconnecting to the live feed…"
                : "Showing the latest available activity while the live feed reconnects."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function EmptyState({
  filter,
  marketScope,
}: {
  filter: ActivityFilter;
  marketScope?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hub-bg-subtle)] ring-1 ring-[var(--hub-border)]">
        <Radio className="h-4 w-4 text-[var(--hub-muted)]" />
      </div>
      <p className="text-[13px] font-medium text-[var(--hub-muted)]">
        {filter === "trades" && "No trades yet"}
        {filter === "updates" && "No market updates yet"}
        {filter === "yours" && "No notifications yet"}
        {filter === "all" && "Tape is quiet"}
      </p>
      <p className="mt-1 max-w-xs text-[11.5px] leading-snug text-[var(--hub-muted)]">
        {marketScope
          ? "Waiting for the next print on this market — fills will stream in here as they happen."
          : "Activity will appear here in real time the moment it lands on the platform."}
      </p>
    </div>
  );
}

export const RealtimeActivityFeed = memo(RealtimeActivityFeedImpl);
