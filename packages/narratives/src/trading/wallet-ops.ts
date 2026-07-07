import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNs } from "@prisma/client";
import { MarketTradeError } from "./errors.js";

/** Platform liquidity account balance adjustments only. */
export async function creditWallet(
  tx: Prisma.TransactionClient,
  walletId: string,
  amount: PrismaNs.Decimal,
): Promise<PrismaNs.Decimal> {
  await tx.wallet.update({
    where: { id: walletId },
    data: { availableBalance: { increment: amount } },
  });
  const row = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
  return row.availableBalance;
}

export async function debitWallet(
  tx: Prisma.TransactionClient,
  walletId: string,
  amount: PrismaNs.Decimal,
): Promise<PrismaNs.Decimal> {
  const updated = await tx.wallet.updateMany({
    where: { id: walletId, availableBalance: { gte: amount } },
    data: { availableBalance: { decrement: amount } },
  });
  if (updated.count !== 1) {
    throw new MarketTradeError(
      "INSUFFICIENT_BALANCE",
      "Insufficient available balance",
      400,
    );
  }
  const row = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
  return row.availableBalance;
}
