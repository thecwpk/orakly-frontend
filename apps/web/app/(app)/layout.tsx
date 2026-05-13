import type { ReactNode } from "react";
import { AppShell } from "@/widgets/app-shell";

/**
 * Shared chrome for the trading surface:
 *   /markets, /markets/*, /portfolio, /activity, /leaderboard, /wallet,
 *   /profile, /profile/[address], /settings/*
 *
 * The `/` hub uses `(hub)` + `MinimalMarketShell` (same top bar + mobile dock).
 *
 * Mounts the global AppShell (sticky top bar, horizontal primary nav, mobile
 * bottom dock + “More” sheet, ambient backdrop, realtime SocketProvider). Page
 * widgets render content only — they should not import a shell of their own.
 *
 * Auth-gated rooms (admin, blockchain/protected) keep their own dedicated layouts.
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
