import type { OutcomeSide, Prisma } from "@prisma/client";
import { Prisma as PrismaNs } from "@prisma/client";
import { MarketTradeError } from "./errors.js";

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

  const newQ = existing.quantity.plus(input.quantity);
  const newAvg = existing.avgEntryPrice
    .mul(existing.quantity)
    .plus(input.price.mul(input.quantity))
    .div(newQ);

  await tx.position.update({
    where: { id: existing.id },
    data: { quantity: newQ, avgEntryPrice: newAvg },
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
    throw new MarketTradeError("NO_POSITION", "No open position for this outcome", 400);
  }

  if (existing.quantity.lessThan(input.quantity)) {
    throw new MarketTradeError(
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
