import type { OutcomeSide } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNs } from "@prisma/client";
import { TradingError } from "./errors";

export async function increasePosition(
  tx: Prisma.TransactionClient,
  input: {
    portfolioId: string;
    marketId: string;
    side: OutcomeSide;
    quantity: PrismaNs.Decimal;
    price: PrismaNs.Decimal;
  },
): Promise<void> {
  const existing = await tx.position.findUnique({
    where: {
      portfolioId_marketId_side: {
        portfolioId: input.portfolioId,
        marketId: input.marketId,
        side: input.side,
      },
    },
  });

  if (!existing) {
    await tx.position.create({
      data: {
        portfolioId: input.portfolioId,
        marketId: input.marketId,
        side: input.side,
        quantity: input.quantity,
        avgEntryPrice: input.price,
      },
    });
    return;
  }

  const oldQ = existing.quantity;
  const addQ = input.quantity;
  const newQ = oldQ.plus(addQ);
  const newAvg = existing.avgEntryPrice
    .mul(oldQ)
    .plus(input.price.mul(addQ))
    .div(newQ);

  await tx.position.update({
    where: { id: existing.id },
    data: {
      quantity: newQ,
      avgEntryPrice: newAvg,
    },
  });
}

export async function decreasePosition(
  tx: Prisma.TransactionClient,
  input: {
    portfolioId: string;
    marketId: string;
    side: OutcomeSide;
    quantity: PrismaNs.Decimal;
  },
): Promise<void> {
  const existing = await tx.position.findUnique({
    where: {
      portfolioId_marketId_side: {
        portfolioId: input.portfolioId,
        marketId: input.marketId,
        side: input.side,
      },
    },
  });

  if (!existing) {
    throw new TradingError("NO_POSITION", "No open position for this outcome", 400);
  }

  if (existing.quantity.lessThan(input.quantity)) {
    throw new TradingError(
      "INSUFFICIENT_SHARES",
      "Cannot sell more shares than held",
      400,
    );
  }

  const newQ = existing.quantity.minus(input.quantity);
  if (newQ.lte(0)) {
    await tx.position.delete({ where: { id: existing.id } });
    return;
  }

  await tx.position.update({
    where: { id: existing.id },
    data: { quantity: newQ },
  });
}
