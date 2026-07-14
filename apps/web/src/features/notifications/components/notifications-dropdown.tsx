"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  Coins,
  Plus,
  Star,
  ThumbsUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useWalletNotificationsQuery } from "@/shared/api/hooks";
import { markWalletNotificationsRead } from "@/shared/api/fetchers/wallet-notifications";
import { queryKeys } from "@/shared/api/query-keys";
import { useNotificationsStore } from "../store/use-notifications-store";
import type { AppNotification, AppNotificationType } from "../types";
import { usePortfolioRealtimeTick } from "@/websocket/hooks/usePortfolioRealtimeTick";
import {
  getFeedGeneration,
  subscribeFeed,
} from "@/websocket/store/feed-store";
import { useAuthStore } from "@/state/stores/auth.store";

const TYPE_META: Record<
  AppNotificationType,
  { icon: LucideIcon; iconClass: string; circleClass: string }
> = {
  SETTLEMENT: {
    icon: Check,
    iconClass: "text-emerald-300",
    circleClass: "bg-emerald-500/15 ring-emerald-400/30",
  },
  APPROVAL: {
    icon: Star,
    iconClass: "text-sky-300",
    circleClass: "bg-sky-500/15 ring-sky-400/30",
  },
  VOTE: {
    icon: ThumbsUp,
    iconClass: "text-violet-300",
    circleClass: "bg-violet-500/15 ring-violet-400/30",
  },
  REWARD: {
    icon: Coins,
    iconClass: "text-amber-300",
    circleClass: "bg-amber-500/15 ring-amber-400/30",
  },
  MARKET_CLOSING: {
    icon: Clock3,
    iconClass: "text-orange-300",
    circleClass: "bg-orange-500/15 ring-orange-400/30",
  },
  NEW_MARKET: {
    icon: Plus,
    iconClass: "text-teal-300",
    circleClass: "bg-teal-500/15 ring-teal-400/30",
  },
};

function formatRelative(at: string): string {
  const ms = Date.now() - new Date(at).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/**
 * Notifications dropdown — opens from the topbar bell.
 */
export function NotificationsDropdown() {
  const router = useRouter();
  const qc = useQueryClient();
  const { address, status } = useAccount();
  const tradingUserId = useAuthStore((s) => s.tradingUserId ?? undefined);
  const connected = status === "connected" && Boolean(address);
  const walletAddress = connected ? address!.toLowerCase() : undefined;

  const open = useNotificationsStore((s) => s.popoverOpen);
  const setOpen = useNotificationsStore((s) => s.setPopoverOpen);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const items = useNotificationsStore((s) => s.items);
  const setAppNotifications = useNotificationsStore((s) => s.setAppNotifications);
  const markReadLocal = useNotificationsStore((s) => s.markRead);
  const markAllLocal = useNotificationsStore((s) => s.markAllRead);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const notificationsQ = useWalletNotificationsQuery(walletAddress, {
    pollMs: 30_000,
  });

  const portfolioTick = usePortfolioRealtimeTick(tradingUserId);

  useEffect(() => {
    if (!notificationsQ.data) return;
    setAppNotifications(
      notificationsQ.data.notifications,
      notificationsQ.data.unreadCount,
    );
  }, [notificationsQ.data, setAppNotifications]);

  useEffect(() => {
    if (!walletAddress || portfolioTick === 0) return;
    void qc.invalidateQueries({
      queryKey: queryKeys.activity.walletNotifications(walletAddress),
    });
  }, [portfolioTick, walletAddress, qc]);

  useEffect(() => {
    if (!walletAddress) return;
    return subscribeFeed(() => {
      void qc.invalidateQueries({
        queryKey: queryKeys.activity.walletNotifications(walletAddress),
      });
      void getFeedGeneration();
    });
  }, [walletAddress, qc]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  async function markRead(ids: string[], markAll = false) {
    if (!walletAddress) return;
    if (markAll) markAllLocal();
    else ids.forEach((id) => markReadLocal(id));
    try {
      const result = await markWalletNotificationsRead({
        walletAddress,
        ids,
        markAll,
      });
      setUnreadCount(result.unreadCount);
      void qc.invalidateQueries({
        queryKey: queryKeys.activity.walletNotifications(walletAddress),
      });
    } catch {
      /* optimistic UI already applied */
    }
  }

  function onRowClick(n: AppNotification) {
    void markRead([n.id]);
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
        className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition hover:border-white/[0.11] hover:bg-white/[0.06] hover:text-zinc-100"
      >
        <Bell className="h-[15px] w-[15px]" strokeWidth={2} />
        <AnimatePresence>
          {unreadCount > 0 ? (
            <motion.span
              key="badge"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#070709]"
              aria-hidden
            />
          ) : null}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 top-[calc(100%+10px)] z-50 flex w-[min(calc(100vw-1.5rem),380px)] flex-col overflow-hidden",
              "max-h-[480px] rounded-xl border border-white/[0.08] bg-[#12141c] shadow-xl",
            )}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
              <p className="min-w-0 flex-1 text-[13px] font-semibold tracking-tight text-white">
                Notifications
              </p>
              <button
                type="button"
                disabled={!connected || unreadCount === 0}
                onClick={() => void markRead([], true)}
                className="text-sm text-zinc-400 transition hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Mark all read
              </button>
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
                className="inline-flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
              {!connected ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-[13px] font-medium text-zinc-300">
                    Connect wallet to see notifications
                  </p>
                </div>
              ) : notificationsQ.isLoading && items.length === 0 ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-lg bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <CheckCheck className="size-5 text-zinc-600" />
                  <p className="text-[13px] font-medium text-zinc-300">
                    You&apos;re all caught up
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Settlements, approvals, and rewards will show up here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.04] py-1">
                  {items.map((n) => {
                    const meta = TYPE_META[n.type];
                    const Icon = meta.icon;
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => onRowClick(n)}
                          className={cn(
                            "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition hover:bg-white/[0.04]",
                            !n.read && "bg-white/[0.015]",
                          )}
                        >
                          <span className="mt-1.5 flex w-2 shrink-0 justify-center">
                            {!n.read ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.55)]" />
                            ) : null}
                          </span>
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-full ring-1",
                              meta.circleClass,
                            )}
                          >
                            <Icon className={cn("size-4", meta.iconClass)} />
                          </span>
                          <span className="min-w-0 flex-1 pt-0.5">
                            <span className="block text-[13px] leading-snug text-zinc-100">
                              {n.message}
                            </span>
                            <span className="mt-1 block text-[11px] text-zinc-500">
                              {formatRelative(n.at)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="shrink-0 border-t border-white/[0.06] px-3 py-2">
              <button
                type="button"
                disabled={!connected}
                onClick={() => {
                  void markRead([], true);
                  setOpen(false);
                }}
                className="w-full text-center text-[12px] font-medium text-zinc-400 transition hover:text-zinc-200 disabled:opacity-40"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
