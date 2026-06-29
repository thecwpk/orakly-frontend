import type { Prisma } from "@prisma/client";
import { toDec } from "./constants";

const DEFAULT_STARTER_BALANCE_USD = 10_000;

function starterBalance(): ReturnType<typeof toDec> {
  const raw = process.env.TRADING_STARTER_BALANCE_USD?.trim();
  const n = raw ? Number(raw) : DEFAULT_STARTER_BALANCE_USD;
  return toDec(Number.isFinite(n) && n > 0 ? n : DEFAULT_STARTER_BALANCE_USD);
}

export async function ensureWalletAndPortfolio(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  await tx.user.findUniqueOrThrow({ where: { id: userId } });

  let wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await tx.wallet.create({
      data: {
        userId,
        availableBalance: starterBalance(),
        lockedBalance: toDec(0),
      },
    });
  } else if (
    wallet.availableBalance.equals(0) &&
    wallet.lockedBalance.equals(0)
  ) {
    const priorTrades = await tx.trade.count({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    });
    if (priorTrades === 0) {
      wallet = await tx.wallet.update({
        where: { userId },
        data: { availableBalance: starterBalance() },
      });
    }
  }

  let portfolio = await tx.portfolio.findUnique({ where: { userId } });
  if (!portfolio) {
    portfolio = await tx.portfolio.create({ data: { userId } });
  }

  return { wallet, portfolio };
}
