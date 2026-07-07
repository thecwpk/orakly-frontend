import { prisma } from "@orakly/database";

export type MarketTradeRow = {
  id: string;
  marketId: string;
  outcome: "YES" | "NO";
  price: string;
  quantity: string;
  notionalUsd: string;
  buyerId: string;
  sellerId: string;
  executedAt: string;
};

export async function listMarketTrades(input: {
  marketId: string;
  take?: number;
}): Promise<MarketTradeRow[]> {
  const take = Math.min(200, Math.max(1, input.take ?? 50));

  const trades = await prisma.trade.findMany({
    where: { marketId: input.marketId },
    orderBy: [{ executedAt: "desc" }, { id: "desc" }],
    take,
    select: {
      id: true,
      marketId: true,
      outcome: true,
      price: true,
      quantity: true,
      notionalUsd: true,
      buyerId: true,
      sellerId: true,
      executedAt: true,
    },
  });

  return trades.map((t) => ({
    id: t.id,
    marketId: t.marketId,
    outcome: t.outcome,
    price: t.price.toFixed(),
    quantity: t.quantity.toFixed(),
    notionalUsd: t.notionalUsd.toFixed(),
    buyerId: t.buyerId,
    sellerId: t.sellerId,
    executedAt: t.executedAt.toISOString(),
  }));
}
