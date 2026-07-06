import type { FeedActivityPayload } from "@orakly/realtime-protocol";
import { prisma } from "@orakly/database";

/** Recent tape rows for HTTP fallback when Socket.IO is offline. */
export async function getActivityFeed(input?: {
  take?: number;
}): Promise<FeedActivityPayload[]> {
  const take = Math.min(200, Math.max(1, input?.take ?? 120));

  const rows = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      createdAt: true,
      type: true,
      title: true,
      payload: true,
      marketId: true,
      trade: {
        select: {
          id: true,
          outcome: true,
          price: true,
          quantity: true,
          notionalUsd: true,
          buyerId: true,
          takerId: true,
        },
      },
    },
  });

  return rows.map((row) => {
    const trade = row.trade;
    const direction =
      trade && trade.takerId === trade.buyerId ? ("BUY" as const) : ("SELL" as const);
    const payload =
      row.payload && typeof row.payload === "object"
        ? {
            ...(row.payload as Record<string, unknown>),
            ...(trade
              ? {
                  tradeId: trade.id,
                  price: trade.price.toFixed(),
                  quantity: trade.quantity.toFixed(),
                  notionalUsd: trade.notionalUsd.toFixed(),
                  outcome: trade.outcome,
                  side: direction,
                }
              : {}),
          }
        : trade
          ? {
              tradeId: trade.id,
              price: trade.price.toFixed(),
              quantity: trade.quantity.toFixed(),
              notionalUsd: trade.notionalUsd.toFixed(),
              outcome: trade.outcome,
              side: direction,
            }
          : {};

    return {
      activityId: row.id,
      marketId: row.marketId,
      activityType: row.type,
      title: row.title,
      payload,
      at: row.createdAt.getTime(),
    };
  });
}
