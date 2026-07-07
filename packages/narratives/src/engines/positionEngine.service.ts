import { prisma } from "@orakly/database";
import {
  MarketStatus,
  OutcomeSide,
  Prisma,
} from "@prisma/client";

type Tx = Prisma.TransactionClient;

function toDec(v: string | number | Prisma.Decimal): Prisma.Decimal {
  return v instanceof Prisma.Decimal ? v : new Prisma.Decimal(v);
}

function clampPrice(v: Prisma.Decimal): Prisma.Decimal {
  const min = toDec("0.01");
  const max = toDec("0.99");
  if (v.lessThan(min)) return min;
  if (v.greaterThan(max)) return max;
  return v;
}

export type PositionUpsertInput = {
  portfolioId: string;
  marketId: string;
  side: OutcomeSide;
  quantity: Prisma.Decimal;
  price: Prisma.Decimal;
};

export async function upsertPositionOnTrade(
  tx: Tx,
  input: PositionUpsertInput,
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

  if (existing) {
    const totalQty = existing.quantity.plus(input.quantity);
    const avg = existing.avgEntryPrice
      .mul(existing.quantity)
      .plus(input.price.mul(input.quantity))
      .div(totalQty);

    await tx.position.update({
      where: { id: existing.id },
      data: {
        quantity: totalQty,
        avgEntryPrice: clampPrice(avg),
      },
    });
    return;
  }

  await tx.position.create({
    data: {
      portfolioId: input.portfolioId,
      marketId: input.marketId,
      side: input.side,
      quantity: input.quantity,
      avgEntryPrice: clampPrice(input.price),
    },
  });
}

export type PositionPnlResult = {
  positionId: string;
  marketId: string;
  side: OutcomeSide;
  quantity: string;
  avgEntryPrice: string;
  investedUsd: string;
  markValueUsd: string;
  pnlUsd: string;
  realized: boolean;
};

export async function calculatePositionPnl(
  positionId: string,
): Promise<PositionPnlResult | null> {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { market: true },
  });
  if (!position) return null;

  const qty = position.quantity;
  const invested = qty.mul(position.avgEntryPrice);
  const market = position.market;

  if (market.status !== MarketStatus.RESOLVED || !market.resolvedOutcome) {
    const mark =
      position.side === OutcomeSide.YES
        ? (market.yesPrice ?? market.probability ?? toDec("0.5"))
        : (market.noPrice ?? toDec("0.5"));
    const markValue = qty.mul(mark);
    const pnl = markValue.minus(invested);

    return {
      positionId: position.id,
      marketId: position.marketId,
      side: position.side,
      quantity: qty.toFixed(),
      avgEntryPrice: position.avgEntryPrice.toFixed(),
      investedUsd: invested.toFixed(),
      markValueUsd: markValue.toFixed(),
      pnlUsd: pnl.toFixed(),
      realized: false,
    };
  }

  const won = position.side === market.resolvedOutcome;
  const payoutPerShare = won ? toDec(1) : toDec(0);
  const payout = qty.mul(payoutPerShare);
  const pnl = payout.minus(invested);

  return {
    positionId: position.id,
    marketId: position.marketId,
    side: position.side,
    quantity: qty.toFixed(),
    avgEntryPrice: position.avgEntryPrice.toFixed(),
    investedUsd: invested.toFixed(),
    markValueUsd: payout.toFixed(),
    pnlUsd: pnl.toFixed(),
    realized: true,
  };
}

export async function syncPortfolioRealizedPnl(userId: string): Promise<string> {
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: {
      positions: {
        include: { market: true },
      },
    },
  });
  if (!portfolio) return "0";

  let total = toDec(0);
  for (const pos of portfolio.positions) {
    const row = await calculatePositionPnl(pos.id);
    if (row?.realized) total = total.plus(row.pnlUsd);
  }

  await prisma.portfolio.update({
    where: { id: portfolio.id },
    data: { realizedPnlUsd: total },
  });

  return total.toFixed();
}
