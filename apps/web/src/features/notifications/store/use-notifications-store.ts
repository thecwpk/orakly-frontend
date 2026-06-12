"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Notification,
  NotificationFilter,
  NotificationKind,
} from "../types";

type NotificationsStore = {
  notifications: Notification[];
  filter: NotificationFilter;
  popoverOpen: boolean;
  /** Server-backed rows merged at read time in the popover hook. */
  hydratedFromApi: boolean;

  setFilter: (f: NotificationFilter) => void;
  setPopoverOpen: (open: boolean) => void;
  togglePopover: () => void;
  setFromApi: (rows: Notification[]) => void;

  push: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      notifications: [],
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
          return {
            hydratedFromApi: true,
            notifications: [...rows, ...localOnly].slice(0, 120),
          };
        }),

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
      clear: () => set({ notifications: [], hydratedFromApi: false }),
    }),
    {
      name: "orakly:notifications",
      version: 2,
      partialize: (s) => ({
        notifications: s.notifications,
        filter: s.filter,
        hydratedFromApi: s.hydratedFromApi,
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
