"use client";

/**
 * Topbar bell — re-exports the frozen notifications dropdown.
 * Kept as `NotificationBell` so existing shell imports keep working.
 */
export { NotificationsDropdown as NotificationBell } from "@/features/notifications";
