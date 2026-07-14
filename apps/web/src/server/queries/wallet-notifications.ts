import "server-only";

import { ActivityType, type Prisma } from "@prisma/client";
import { prisma } from "@orakly/database";

export type AppNotificationType =
  | "SETTLEMENT"
  | "APPROVAL"
  | "VOTE"
  | "REWARD"
  | "MARKET_CLOSING"
  | "NEW_MARKET";

export type AppNotificationDto = {
  id: string;
  type: AppNotificationType;
  message: string;
  at: string;
  href: string | null;
  marketSlug: string | null;
  read: boolean;
};

export type NotificationsListResult = {
  notifications: AppNotificationDto[];
  unreadCount: number;
};

/** Notification ActivityType values written by create-notification helpers. */
const NOTIFICATION_TYPES: ActivityType[] = [
  ActivityType.SETTLEMENT,
  ActivityType.APPROVAL,
  ActivityType.VOTE_MILESTONE,
  ActivityType.REWARD,
  ActivityType.MARKET_CLOSING,
  // Legacy mapped types still shown in the inbox.
  ActivityType.MARKET_RESOLVED,
  ActivityType.POSITION_CLOSED,
  ActivityType.MARKET_CREATED,
  ActivityType.ADMIN_ACTION,
];

type Payload = {
  notificationType?: string;
  kind?: string;
  message?: string;
  question?: string;
  marketTitle?: string;
  marketQuestion?: string;
  narrative?: string;
  amountBnb?: number | string;
  amount?: number | string;
  wonBnb?: number | string;
  rewardBnb?: number | string;
  votes?: number | string;
  voteCount?: number | string;
  hoursLeft?: number | string;
  read?: boolean;
  href?: string;
};

function asPayload(raw: unknown): Payload {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Payload;
  }
  return {};
}

function isAppType(value: string | undefined): value is AppNotificationType {
  return (
    value === "SETTLEMENT" ||
    value === "APPROVAL" ||
    value === "VOTE" ||
    value === "REWARD" ||
    value === "MARKET_CLOSING" ||
    value === "NEW_MARKET"
  );
}

function resolveType(
  activityType: ActivityType,
  payload: Payload,
): AppNotificationType | null {
  if (isAppType(payload.notificationType)) return payload.notificationType;
  if (isAppType(payload.kind)) return payload.kind;

  switch (activityType) {
    case ActivityType.SETTLEMENT:
      return "SETTLEMENT";
    case ActivityType.APPROVAL:
      return "APPROVAL";
    case ActivityType.VOTE_MILESTONE:
      return "VOTE";
    case ActivityType.REWARD:
      return "REWARD";
    case ActivityType.MARKET_CLOSING:
      return "MARKET_CLOSING";
    case ActivityType.MARKET_RESOLVED:
    case ActivityType.POSITION_CLOSED:
      return "SETTLEMENT";
    case ActivityType.MARKET_CREATED:
      return "NEW_MARKET";
    case ActivityType.ADMIN_ACTION: {
      const action = String(payload.kind ?? payload.message ?? "").toLowerCase();
      if (action.includes("approv")) return "APPROVAL";
      if (action.includes("reward") || action.includes("fee")) return "REWARD";
      if (action.includes("vote")) return "VOTE";
      if (action.includes("clos")) return "MARKET_CLOSING";
      return "APPROVAL";
    }
    default:
      return null;
  }
}

function formatBnb(raw: number | string | undefined, fallback = "0"): string {
  if (raw == null) return fallback;
  const n = typeof raw === "number" ? raw : Number.parseFloat(raw);
  if (!Number.isFinite(n)) return String(raw);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function buildMessage(
  type: AppNotificationType,
  title: string | null,
  payload: Payload,
  marketTitle: string | null,
  narrative: string | null,
): string {
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  const question =
    payload.question ??
    payload.marketQuestion ??
    payload.marketTitle ??
    marketTitle ??
    title ??
    "a market";
  const narrativeName = payload.narrative ?? narrative ?? "A narrative";

  switch (type) {
    case "SETTLEMENT":
      return `You won ${formatBnb(payload.wonBnb ?? payload.amountBnb ?? payload.amount, "0")} BNB on ${question}`;
    case "APPROVAL":
      return "Your market suggestion was approved!";
    case "VOTE":
      return `Your suggestion reached ${payload.voteCount ?? payload.votes ?? 10} votes!`;
    case "REWARD":
      return `You earned ${formatBnb(payload.rewardBnb ?? payload.amountBnb ?? payload.amount, "0.05")} BNB in creator rewards from ${question}.`;
    case "MARKET_CLOSING":
      return `Market closing in ${payload.hoursLeft ?? 1} hour: ${question}`;
    case "NEW_MARKET":
      return `${narrativeName} has a new market: ${question}`;
    default:
      return title ?? "Notification";
  }
}

function resolveHref(
  type: AppNotificationType,
  payload: Payload,
  marketSlug: string | null,
): string | null {
  if (typeof payload.href === "string" && payload.href.startsWith("/")) {
    return payload.href;
  }
  if (marketSlug) return `/markets/${marketSlug}`;
  if (type === "APPROVAL" || type === "VOTE") return "/markets/community";
  if (type === "NEW_MARKET") return "/markets";
  return null;
}

async function resolveUserId(walletAddress: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { walletAddress: { equals: walletAddress.trim(), mode: "insensitive" } },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function listWalletNotifications(input: {
  walletAddress: string;
  limit?: number;
}): Promise<NotificationsListResult> {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const userId = await resolveUserId(input.walletAddress);
  if (!userId) {
    return { notifications: [], unreadCount: 0 };
  }

  const [rows, unreadCount] = await Promise.all([
    prisma.activity.findMany({
      where: {
        userId,
        type: { in: NOTIFICATION_TYPES },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        market: {
          select: {
            slug: true,
            title: true,
            narrative: true,
          },
        },
      },
    }),
    prisma.activity.count({
      where: {
        userId,
        type: { in: NOTIFICATION_TYPES },
        isRead: false,
      },
    }),
  ]);

  const notifications: AppNotificationDto[] = [];
  for (const row of rows) {
    const payload = asPayload(row.payload);
    const type = resolveType(row.type, payload);
    if (!type) continue;

    notifications.push({
      id: row.id,
      type,
      message: buildMessage(
        type,
        row.title,
        payload,
        row.market?.title ?? null,
        row.market?.narrative ?? null,
      ),
      at: row.createdAt.toISOString(),
      href: resolveHref(type, payload, row.market?.slug ?? null),
      marketSlug: row.market?.slug ?? null,
      read: row.isRead === true || payload.read === true,
    });
  }

  return { notifications, unreadCount };
}

export async function markNotificationsRead(input: {
  walletAddress: string;
  ids: string[];
  markAll?: boolean;
}): Promise<{ updated: number; unreadCount: number }> {
  const userId = await resolveUserId(input.walletAddress);
  if (!userId) {
    return { updated: 0, unreadCount: 0 };
  }

  const where: Prisma.ActivityWhereInput = {
    userId,
    type: { in: NOTIFICATION_TYPES },
    isRead: false,
    ...(input.markAll
      ? {}
      : { id: { in: input.ids.filter((id) => id.trim().length > 0) } }),
  };

  const result = await prisma.activity.updateMany({
    where,
    data: { isRead: true },
  });

  const unreadCount = await prisma.activity.count({
    where: {
      userId,
      type: { in: NOTIFICATION_TYPES },
      isRead: false,
    },
  });

  return { updated: result.count, unreadCount };
}
