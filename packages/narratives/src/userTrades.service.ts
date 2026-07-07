import { prisma } from "@orakly/database";

function decodeTradeCursor(
  cursor: string | null | undefined,
): { executedAt: Date; id: string } | null {
  if (!cursor?.trim()) return null;
  const hash = cursor.lastIndexOf("#");
  if (hash === -1) return null;
  const iso = cursor.slice(0, hash);
  const id = cursor.slice(hash + 1);
  const executedAt = new Date(iso);
  if (Number.isNaN(executedAt.getTime()) || !id) return null;
  return { executedAt, id };
}

export function encodeTradeCursor(row: { executedAt: Date; id: string }) {
  return `${row.executedAt.toISOString()}#${row.id}`;
}

export async function listUserTrades(input: {
  userId: string;
  take?: number;
  cursor?: string | null;
}) {
  const take = Math.min(input.take ?? 50, 200);
  const decoded = decodeTradeCursor(input.cursor);
  const trades = await prisma.trade.findMany({
    where: {
      OR: [{ buyerId: input.userId }, { sellerId: input.userId }],
      ...(decoded
        ? {
            OR: [
              { executedAt: { lt: decoded.executedAt } },
              {
                AND: [
                  { executedAt: decoded.executedAt },
                  { id: { lt: decoded.id } },
                ],
              },
            ],
          }
        : {}),
    },
    orderBy: [{ executedAt: "desc" }, { id: "desc" }],
    take: take + 1,
    select: {
      id: true,
      marketId: true,
      outcome: true,
      price: true,
      quantity: true,
      notionalUsd: true,
      buyerId: true,
      sellerId: true,
      feeBuyerUsd: true,
      feeSellerUsd: true,
      executedAt: true,
    },
  });

  let nextCursor: string | null = null;
  const page =
    trades.length > take
      ? (() => {
          const boundary = trades[take - 1]!;
          nextCursor = encodeTradeCursor(boundary);
          return trades.slice(0, take);
        })()
      : trades;

  return {
    trades: page.map((t) => ({
      ...t,
      price: t.price.toFixed(),
      quantity: t.quantity.toFixed(),
      notionalUsd: t.notionalUsd.toFixed(),
      feeBuyerUsd: t.feeBuyerUsd.toFixed(),
      feeSellerUsd: t.feeSellerUsd.toFixed(),
      side:
        t.buyerId === input.userId ? ("BUY" as const) : ("SELL" as const),
    })),
    nextCursor,
  };
}
