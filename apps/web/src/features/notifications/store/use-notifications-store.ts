"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ROUTES } from "@/shared/constants/routes";
import type {
  Notification,
  NotificationFilter,
  NotificationKind,
} from "../types";

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    kind: "FILL",
    title: "Filled — BTC ATH Q3",
    body: "Bought 1,200 YES @ 47¢. Realized slip 0.3 bps.",
    at: new Date(Date.now() - 90_000).toISOString(),
    href: "/markets/btc-ath-q3",
    marketSlug: "btc-ath-q3",
    read: false,
  },
  {
    id: "n-2",
    kind: "ALERT",
    title: "Odds moved — Fed cut by July",
    body: "YES crossed 65% threshold (was 61%).",
    at: new Date(Date.now() - 6 * 60_000).toISOString(),
    href: "/markets/fed-rate-cut-june",
    marketSlug: "fed-rate-cut-june",
    read: false,
  },
  {
    id: "n-3",
    kind: "SETTLE",
    title: "Settlement — Election turnout",
    body: "Resolved YES. Net +$240 credited to portfolio.",
    at: new Date(Date.now() - 60 * 60_000).toISOString(),
    href: "/markets/election-turnout-2028",
    marketSlug: "election-turnout-2028",
    read: false,
  },
  {
    id: "n-4",
    kind: "MENTION",
    title: "ConvexAlpha mentioned you",
    body: "“Nice fade on the macro tape this morning.”",
    at: new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
    read: true,
  },
  {
    id: "n-5",
    kind: "SYSTEM",
    title: "New market launched",
    body: "Will SOL flip ETH by year-end? — seeded with $5k.",
    at: new Date(Date.now() - 28 * 60 * 60_000).toISOString(),
    href: ROUTES.marketsBrowse,
    read: true,
  },
];

type NotificationsStore = {
  notifications: Notification[];
  filter: NotificationFilter;
  /** Per-session: whether the popover is open. Not persisted. */
  popoverOpen: boolean;

  setFilter: (f: NotificationFilter) => void;
  setPopoverOpen: (open: boolean) => void;
  togglePopover: () => void;

  push: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      notifications: SEED_NOTIFICATIONS,
      filter: "all",
      popoverOpen: false,

      setFilter: (filter) => set({ filter }),
      setPopoverOpen: (popoverOpen) => set({ popoverOpen }),
      togglePopover: () => set((s) => ({ popoverOpen: !s.popoverOpen })),

      push: (n) =>
        set((s) => ({
          notifications: [n, ...s.notifications.filter((x) => x.id !== n.id)].slice(
            0,
            120,
          ),
        })),
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      clear: () => set({ notifications: [] }),
    }),
    {
      name: "orakly:notifications",
      version: 1,
      partialize: (s) => ({
        notifications: s.notifications,
        filter: s.filter,
      }),
    },
  ),
);

export const selectUnreadCount = (s: NotificationsStore) =>
  s.notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);

export const selectFilteredNotifications = (s: NotificationsStore) =>
  s.filter === "all"
    ? s.notifications
    : s.notifications.filter((n) => n.kind === s.filter);

export const NOTIFICATION_FILTERS: readonly {
  id: NotificationFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "FILL", label: "Fills" },
  { id: "SETTLE", label: "Settles" },
  { id: "ALERT", label: "Alerts" },
  { id: "MENTION", label: "Mentions" },
] as const;

export type { Notification, NotificationFilter, NotificationKind };
