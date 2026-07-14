"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppNotification,
  Notification,
  NotificationFilter,
} from "../types";

type NotificationsStore = {
  notifications: Notification[];
  items: AppNotification[];
  unreadCount: number;
  filter: NotificationFilter;
  popoverOpen: boolean;
  hydratedFromApi: boolean;

  setFilter: (f: NotificationFilter) => void;
  setPopoverOpen: (open: boolean) => void;
  togglePopover: () => void;
  setFromApi: (rows: Notification[]) => void;
  setAppNotifications: (rows: AppNotification[], unreadCount?: number) => void;
  setUnreadCount: (count: number) => void;

  push: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

function toLegacy(n: AppNotification): Notification {
  return {
    id: n.id,
    kind: n.type === "SETTLEMENT" ? "SETTLE" : "SYSTEM",
    title: n.type.replaceAll("_", " "),
    body: n.message,
    at: n.at,
    href: n.href ?? undefined,
    marketSlug: n.marketSlug ?? undefined,
    read: n.read,
  };
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      notifications: [],
      items: [],
      unreadCount: 0,
      filter: "all",
      popoverOpen: false,
      hydratedFromApi: false,

      setFilter: (filter) => set({ filter }),
      setPopoverOpen: (popoverOpen) => set({ popoverOpen }),
      togglePopover: () => set((s) => ({ popoverOpen: !s.popoverOpen })),

      setFromApi: (rows) =>
        set((s) => {
          const localOnly = s.notifications.filter(
            (n) => !rows.some((r) => r.id === n.id),
          );
          const notifications = [...rows, ...localOnly].slice(0, 120);
          return {
            hydratedFromApi: true,
            notifications,
            unreadCount: notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
          };
        }),

      setAppNotifications: (items, unreadCount) =>
        set({
          hydratedFromApi: true,
          items,
          notifications: items.map(toLegacy),
          unreadCount:
            unreadCount ?? items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
        }),

      setUnreadCount: (unreadCount) => set({ unreadCount }),

      push: (n) =>
        set((s) => {
          const notifications = [n, ...s.notifications.filter((x) => x.id !== n.id)].slice(
            0,
            120,
          );
          return {
            notifications,
            unreadCount: notifications.reduce((acc, row) => acc + (row.read ? 0 : 1), 0),
          };
        }),
      markRead: (id) =>
        set((s) => {
          const items = s.items.map((n) => (n.id === id ? { ...n, read: true } : n));
          const notifications = s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          );
          return {
            items,
            notifications,
            unreadCount: items.length
              ? items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0)
              : notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
          };
        }),
      markAllRead: () =>
        set((s) => ({
          items: s.items.map((n) => ({ ...n, read: true })),
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),
      clear: () =>
        set({
          notifications: [],
          items: [],
          unreadCount: 0,
          hydratedFromApi: false,
        }),
    }),
    {
      name: "orakly:notifications",
      version: 3,
      partialize: (s) => ({
        notifications: s.notifications,
        items: s.items,
        unreadCount: s.unreadCount,
        filter: s.filter,
        hydratedFromApi: s.hydratedFromApi,
      }),
    },
  ),
);

export const selectUnreadCount = (s: NotificationsStore) => s.unreadCount;

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

export type { Notification, NotificationFilter, NotificationKind, AppNotification };
