"use client";

import { motion } from "framer-motion";
import {
  AtSign,
  Bell,
  CheckCircle2,
  CircleDot,
  Flag,
  Info,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { compactUsd, probToCents } from "../lib/format";
import { timeAgo } from "../lib/time";
import type {
  ActivityRow as ActivityRowType,
  NotificationActivityRow,
  TradeActivityRow,
  UpdateActivityRow,
} from "../lib/types";

type RowProps = {
  row: ActivityRowType;
  /** Used for time-ago label refreshes; passed in from parent's `useNowTick`. */
  now: number;
  compact?: boolean;
  /** Terminal tape — minimal vertical rhythm (Dexscreener-like). */
  dense?: boolean;
  /** One-shot pulse when row just hit the tape (newest fills). */
  fresh?: boolean;
};

function ActivityRowImpl({ row, now, compact, dense, fresh }: RowProps) {
  if (row.kind === "trade")
    return <TradeRow row={row} now={now} compact={compact} dense={dense} fresh={fresh} />;
  if (row.kind === "update")
    return <UpdateRow row={row} now={now} compact={compact} dense={dense} fresh={fresh} />;
  return <NotificationRow row={row} now={now} compact={compact} dense={dense} />;
}

export const ActivityRow = memo(ActivityRowImpl);

// ─────────────────────────────────────────────────────────────────────────────
// Trade row

function TradeRow({
  row,
  now,
  compact,
  dense,
  fresh,
}: {
  row: TradeActivityRow;
  now: number;
  compact?: boolean;
  dense?: boolean;
  fresh?: boolean;
}) {
  const isBuy = row.side === "BUY";
  const isYes = row.outcome === "YES";

  const sideTone = isBuy
    ? "text-emerald-200 bg-emerald-500/15 ring-emerald-400/30"
    : "text-rose-100 bg-rose-500/15 ring-rose-400/30";

  const outcomeTone = isYes
    ? "text-cyan-200 bg-cyan-500/10 ring-cyan-400/25"
    : "text-violet-200 bg-violet-500/10 ring-violet-400/25";

  const stripGradient = isBuy
    ? "from-emerald-400/0 via-emerald-400/70 to-emerald-400/0"
    : "from-rose-400/0 via-rose-400/70 to-rose-400/0";

  const TrendIcon: LucideIcon = isBuy ? TrendingUp : TrendingDown;
  const ago = timeAgo(row.at, now);

  const href = row.market ? ROUTES.market(row.market.slug) : null;
  const wrapperClass = cn(
    "relative flex items-center gap-3 transition-colors hover:bg-white/[0.04]",
    dense ? "gap-2 px-2 py-1" : compact ? "px-3 py-2" : "px-4 py-2.5",
    href ? "cursor-pointer" : "",
  );

  const body = (
    <>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-px font-mono font-bold ring-1",
          dense ? "text-[9px]" : "gap-1 rounded-md px-1.5 py-0.5 text-[10px]",
          sideTone,
        )}
      >
        <TrendIcon className={dense ? "h-2 w-2" : "h-2.5 w-2.5"} />
        {row.side}
      </span>
      <span
        className={cn(
          "shrink-0 rounded px-1 py-px font-mono font-bold ring-1",
          dense ? "text-[9px]" : "rounded-md px-1.5 py-0.5 text-[10px]",
          outcomeTone,
        )}
      >
        {row.outcome}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-medium leading-tight text-zinc-100 group-hover:text-white",
            dense ? "text-[11px]" : compact ? "text-[12px]" : "text-[12.5px]",
          )}
        >
          {row.market ? row.market.title : <span className="text-zinc-500">(unknown market)</span>}
        </p>
        <p
          className={cn(
            "mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0 text-zinc-500",
            dense ? "text-[9.5px]" : "text-[10.5px]",
          )}
        >
          <span className="font-mono tabular-nums text-zinc-300">
            {row.quantity.toFixed(2)}
          </span>
          <span className="text-zinc-700">@</span>
          <span className="font-mono tabular-nums text-zinc-300">
            {probToCents(row.price)}
          </span>
          {row.market ? (
            <>
              <span className="text-zinc-700">·</span>
              <span className="uppercase tracking-wider text-zinc-500">
                {row.market.category}
              </span>
            </>
          ) : null}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "font-mono font-semibold tabular-nums",
            dense ? "text-[10.5px]" : "text-[11.5px]",
            isBuy ? "text-emerald-200" : "text-rose-200",
          )}
        >
          {compactUsd(row.notionalUsd)}
        </p>
        <p className={cn("mt-0.5 font-mono tabular-nums text-zinc-600", dense ? "text-[9px]" : "text-[10px]")}>
          {ago}
        </p>
      </div>
    </>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group relative overflow-hidden"
    >
      {fresh ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-400/25 via-cyan-400/15 to-transparent"
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.95, ease: "easeOut" }}
        />
      ) : null}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-b",
          dense ? "w-px" : "w-[2px]",
          stripGradient,
        )}
      />
      {href ? (
        <Link href={href} className={wrapperClass}>
          {body}
        </Link>
      ) : (
        <div className={wrapperClass}>{body}</div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Update row

const UPDATE_ICON: Record<string, { icon: LucideIcon; tone: string; strip: string }> = {
  MARKET_RESOLVED: {
    icon: CheckCircle2,
    tone: "text-emerald-200 bg-emerald-500/15 ring-emerald-400/30",
    strip: "from-emerald-400/0 via-emerald-400/70 to-emerald-400/0",
  },
  MARKET_CLOSED: {
    icon: Flag,
    tone: "text-amber-200 bg-amber-500/15 ring-amber-400/30",
    strip: "from-amber-400/0 via-amber-400/70 to-amber-400/0",
  },
  MARKET_CREATED: {
    icon: Zap,
    tone: "text-cyan-200 bg-cyan-500/15 ring-cyan-400/30",
    strip: "from-cyan-400/0 via-cyan-400/70 to-cyan-400/0",
  },
  POSITION_OPENED: {
    icon: CircleDot,
    tone: "text-violet-200 bg-violet-500/15 ring-violet-400/30",
    strip: "from-violet-400/0 via-violet-400/70 to-violet-400/0",
  },
};

const DEFAULT_UPDATE = {
  icon: Info,
  tone: "text-zinc-200 bg-white/[0.06] ring-white/[0.1]",
  strip: "from-zinc-400/0 via-zinc-400/40 to-zinc-400/0",
} as const;

function UpdateRow({
  row,
  now,
  compact,
  dense,
  fresh,
}: {
  row: UpdateActivityRow;
  now: number;
  compact?: boolean;
  dense?: boolean;
  fresh?: boolean;
}) {
  const meta = UPDATE_ICON[row.variant] ?? DEFAULT_UPDATE;
  const Icon = meta.icon;
  const ago = timeAgo(row.at, now);
  const href = row.market ? ROUTES.market(row.market.slug) : null;
  const wrapperClass = cn(
    "relative flex items-center gap-3 transition-colors hover:bg-white/[0.04]",
    dense ? "gap-2 px-2 py-1" : compact ? "px-3 py-2" : "px-4 py-2.5",
  );

  const body = (
    <>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md ring-1",
          dense ? "h-5 w-5" : "h-6 w-6",
          meta.tone,
        )}
      >
        <Icon className={dense ? "h-2.5 w-2.5" : "h-3 w-3"} />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-medium leading-tight text-zinc-100 group-hover:text-white",
            dense ? "text-[11px]" : compact ? "text-[12px]" : "text-[12.5px]",
          )}
        >
          {row.title}
        </p>
        <p
          className={cn(
            "mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0 text-zinc-500",
            dense ? "text-[9.5px]" : "text-[10.5px]",
          )}
        >
          {row.market ? (
            <>
              <span className="truncate text-zinc-400">{row.market.title}</span>
              <span className="text-zinc-700">·</span>
              <span className="uppercase tracking-wider text-zinc-500">
                {row.market.category}
              </span>
            </>
          ) : row.description ? (
            <span className="truncate text-zinc-400">{row.description}</span>
          ) : (
            <span className="text-zinc-600">platform update</span>
          )}
        </p>
      </div>
      <span className={cn("shrink-0 font-mono tabular-nums text-zinc-600", dense ? "text-[9px]" : "text-[10px]")}>
        {ago}
      </span>
    </>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group relative overflow-hidden"
    >
      {fresh ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-400/20 via-cyan-400/12 to-transparent"
          initial={{ opacity: 0.75 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      ) : null}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-b",
          dense ? "w-px" : "w-[2px]",
          meta.strip,
        )}
      />
      {href ? (
        <Link href={href} className={wrapperClass}>
          {body}
        </Link>
      ) : (
        <div className={wrapperClass}>{body}</div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification row (Yours)

const NOTIF_META: Record<
  NotificationActivityRow["variant"],
  { icon: LucideIcon; tone: string; strip: string }
> = {
  FILL: {
    icon: Zap,
    tone: "text-cyan-200 bg-cyan-500/15 ring-cyan-400/30",
    strip: "from-cyan-400/0 via-cyan-400/70 to-cyan-400/0",
  },
  SETTLE: {
    icon: CheckCircle2,
    tone: "text-emerald-200 bg-emerald-500/15 ring-emerald-400/30",
    strip: "from-emerald-400/0 via-emerald-400/70 to-emerald-400/0",
  },
  ALERT: {
    icon: Bell,
    tone: "text-amber-200 bg-amber-500/15 ring-amber-400/30",
    strip: "from-amber-400/0 via-amber-400/70 to-amber-400/0",
  },
  MENTION: {
    icon: AtSign,
    tone: "text-violet-200 bg-violet-500/15 ring-violet-400/30",
    strip: "from-violet-400/0 via-violet-400/70 to-violet-400/0",
  },
  SYSTEM: {
    icon: Info,
    tone: "text-zinc-200 bg-white/[0.06] ring-white/[0.1]",
    strip: "from-zinc-400/0 via-zinc-400/40 to-zinc-400/0",
  },
};

function NotificationRow({
  row,
  now,
  compact,
  dense,
}: {
  row: NotificationActivityRow;
  now: number;
  compact?: boolean;
  dense?: boolean;
}) {
  const meta = NOTIF_META[row.variant];
  const Icon = meta.icon;
  const ago = timeAgo(row.at, now);
  const href = row.href;

  const inner = (
    <div
      className={cn(
        "flex items-start gap-3 transition-colors hover:bg-white/[0.04]",
        dense ? "gap-2 px-2 py-1" : compact ? "px-3 py-2" : "px-4 py-2.5",
        !row.read && "bg-white/[0.012]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex shrink-0 items-center justify-center rounded-md ring-1",
          dense ? "h-5 w-5" : "h-6 w-6",
          meta.tone,
        )}
      >
        <Icon className={dense ? "h-2.5 w-2.5" : "h-3 w-3"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={cn(
              "truncate font-medium leading-tight text-zinc-100 group-hover:text-white",
              dense ? "text-[11px]" : compact ? "text-[12px]" : "text-[12.5px]",
            )}
          >
            {row.title}
          </p>
          {!row.read ? (
            <span
              aria-hidden
              className={cn(
                "inline-block shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.45)]",
                dense ? "h-1 w-1 animate-pulse" : "h-1.5 w-1.5",
              )}
            />
          ) : null}
        </div>
        <p className={cn("mt-0.5 line-clamp-1 text-zinc-500", dense ? "text-[10px]" : "text-[11px]")}>
          {row.description}
        </p>
      </div>
      <span className={cn("shrink-0 font-mono tabular-nums text-zinc-600", dense ? "text-[9px]" : "text-[10px]")}>
        {ago}
      </span>
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="group relative overflow-hidden"
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b",
          dense ? "w-px" : "w-[2px]",
          meta.strip,
        )}
      />
      {href ? <Link href={href}>{inner}</Link> : inner}
    </motion.div>
  );
}
