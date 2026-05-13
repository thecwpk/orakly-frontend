import type { Prisma } from "@prisma/client";

export async function ensureWalletAndPortfolio(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  await tx.user.findUniqueOrThrow({ where: { id: userId } });

  let wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await tx.wallet.create({ data: { userId } });
  }

  let portfolio = await tx.portfolio.findUnique({ where: { userId } });
  if (!portfolio) {
    portfolio = await tx.portfolio.create({ data: { userId } });
  }

  return { wallet, portfolio };
}
