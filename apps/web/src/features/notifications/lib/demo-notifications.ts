import type { AppNotification } from "../types";
import { ROUTES } from "@/shared/constants/routes";

/**
 * Review / empty-inbox fallback so the frozen nav notifications overlay
 * can be exercised when the wallet has no Activity rows yet.
 * IDs are prefixed `demo-` so mark-read skips the API.
 */
export function buildDemoNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: "demo-settlement-1",
      type: "SETTLEMENT",
      message: "You won 0.12 BNB on Will ETH break $5k this quarter?",
      at: new Date(now - 12 * 60_000).toISOString(),
      href: ROUTES.markets,
      marketSlug: null,
      read: false,
    },
    {
      id: "demo-approval-1",
      type: "APPROVAL",
      message: "Your market suggestion was approved!",
      at: new Date(now - 45 * 60_000).toISOString(),
      href: "/markets/community",
      marketSlug: null,
      read: false,
    },
    {
      id: "demo-vote-1",
      type: "VOTE",
      message: "Your suggestion reached 25 votes!",
      at: new Date(now - 2 * 3600_000).toISOString(),
      href: "/markets/community",
      marketSlug: null,
      read: true,
    },
    {
      id: "demo-reward-1",
      type: "REWARD",
      message: "You earned 0.05 BNB in creator rewards from BTC ETF flows.",
      at: new Date(now - 5 * 3600_000).toISOString(),
      href: ROUTES.portfolio,
      marketSlug: null,
      read: false,
    },
    {
      id: "demo-closing-1",
      type: "MARKET_CLOSING",
      message: "Market closing in 2 hours: Fed rate decision July FOMC",
      at: new Date(now - 8 * 3600_000).toISOString(),
      href: ROUTES.markets,
      marketSlug: null,
      read: true,
    },
  ];
}

export function isDemoNotificationId(id: string): boolean {
  return id.startsWith("demo-");
}
