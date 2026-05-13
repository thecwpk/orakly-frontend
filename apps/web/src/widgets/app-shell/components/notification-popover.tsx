"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AtSign,
  Bell,
  CheckCheck,
  Receipt,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  NOTIFICATION_FILTERS,
  selectFilteredNotifications,
  selectUnreadCount,
  useNotificationsStore,
  type Notification,
  type NotificationKind,
} from "@/features/notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";

const KIND_META: Record<
  NotificationKind,
  { icon: typeof Bell; tone: string; ring: string; bg: string }
> = {
  FILL: {
    icon: Receipt,
    tone: "text-cyan-300",
    ring: "ring-cyan-400/30",
    bg: "bg-cyan-500/10",
  },
  SETTLE: {
    icon: TrendingUp,
    tone: "text-emerald-300",
    ring: "ring-emerald-400/30",
    bg: "bg-emerald-500/10",
  },
  ALERT: {
    icon: Activity,
    tone: "text-amber-300",
    ring: "ring-amber-400/30",
    bg: "bg-amber-500/10",
  },
  MENTION: {
    icon: AtSign,
    tone: "text-violet-300",
    ring: "ring-violet-400/30",
    bg: "bg-violet-500/10",
  },
  SYSTEM: {
    icon: Sparkles,
    tone: "text-zinc-300",
    ring: "ring-white/10",
    bg: "bg-white/[0.04]",
  },
};

function formatRelative(at: string): string {
  const ms = Date.now() - new Date(at).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function NotificationBody({ n }: { n: Notification }) {
  const meta = KIND_META[n.kind];
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-2.5">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1",
          meta.bg,
          meta.ring,
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", meta.tone)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[12.5px] font-medium text-zinc-100">
            {n.title}
          </p>
          {!n.read ? (
            <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-zinc-400">
          {n.body}
        </p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
          {formatRelative(n.at)} ago
        </p>
      </div>
    </div>
  );
}

function NotificationRow({
  n,
  onClick,
}: {
  n: Notification;
  onClick: () => void;
}) {
  const className = cn(
    "group block w-full px-3 py-2.5 text-left transition hover:bg-white/[0.04]",
    !n.read && "bg-white/[0.02]",
  );

  if (n.href) {
    return (
      <Link href={n.href} onClick={onClick} className={className}>
        <NotificationBody n={n} />
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      <NotificationBody n={n} />
    </button>
  );
}

export function NotificationBell() {
  const open = useNotificationsStore((s) => s.popoverOpen);
  const setOpen = useNotificationsStore((s) => s.setPopoverOpen);
  const unread = useNotificationsStore(selectUnreadCount);
  const filter = useNotificationsStore((s) => s.filter);
  const setFilter = useNotificationsStore((s) => s.setFilter);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  /** `.filter()` returns a new array each run — shallow-stabilize for useSyncExternalStore. */
  const list = useNotificationsStore(useShallow(selectFilteredNotifications));

  const top = useMemo(() => list.slice(0, 18), [list]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition hover:border-white/[0.11] hover:bg-white/[0.06] hover:text-zinc-100"
        >
          <Bell className="h-[15px] w-[15px]" strokeWidth={2} />
          <AnimatePresence>
            {unread > 0 ? (
              <motion.span
                key="badge"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-emerald-500 px-0.5 font-mono text-[8px] font-bold tabular-nums text-zinc-950 ring-2 ring-[#070709]"
              >
                {unread > 99 ? "99+" : unread}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[360px] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5">
          <div className="flex items-baseline gap-2">
            <p className="text-[13px] font-semibold tracking-tight text-white">
              Notifications
            </p>
            {unread > 0 ? (
              <span className="text-[10.5px] font-medium text-cyan-300">
                {unread} unread
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread === 0}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] px-2 py-2">
          {NOTIFICATION_FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider transition",
                  active
                    ? "bg-white/[0.08] text-white ring-1 ring-cyan-400/30"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="max-h-[360px] overflow-y-auto [scrollbar-width:thin]">
          {top.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <Sparkles className="h-5 w-5 text-zinc-600" />
              <p className="text-[12px] font-medium text-zinc-300">
                You&apos;re all caught up
              </p>
              <p className="text-[11px] text-zinc-500">
                Fills, settlements & alerts will land here in real time.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {top.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    n={n}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2">
          <Link
            href={ROUTES.activity}
            onClick={() => setOpen(false)}
            className="text-[11px] font-medium text-zinc-400 transition hover:text-zinc-200"
          >
            Open activity →
          </Link>
          <span className="text-[10px] text-zinc-600">
            {top.length} of {list.length}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
