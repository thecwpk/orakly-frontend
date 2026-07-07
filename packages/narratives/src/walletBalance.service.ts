import { prisma } from "@orakly/database";
import { LedgerEntryType, MarketStatus, Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

function toDec(v: string | number | Prisma.Decimal): Prisma.Decimal {
  return v instanceof Prisma.Decimal ? v : new Prisma.Decimal(v);
}

export type WalletBalanceComponents = {
  userId: string;
  depositsUsd: string;
  withdrawalsUsd: string;
  openPositionsValueUsd: string;
  realizedPnlUsd: string;
  availableBalanceUsd: string;
  lockedBalanceUsd: string;
  totalBalanceUsd: string;
};

async function sumLedgerType(
  userId: string,
  type: LedgerEntryType,
  db: Tx | typeof prisma,
): Promise<Prisma.Decimal> {
  const agg = await db.ledgerEntry.aggregate({
    where: { userId, type },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? toDec(0);
}

export async function computeWalletBalanceComponents(
  userId: string,
  db: Tx | typeof prisma = prisma,
): Promise<WalletBalanceComponents> {
  const [deposits, withdrawSum, portfolio, positions] = await Promise.all([
    sumLedgerType(userId, LedgerEntryType.DEPOSIT, db),
    sumLedgerType(userId, LedgerEntryType.WITHDRAW, db),
    db.portfolio.findUnique({ where: { userId } }),
    db.position.findMany({
      where: { portfolio: { userId } },
      include: { market: { select: { status: true } } },
    }),
  ]);

  const withdrawals = withdrawSum.lessThan(0) ? withdrawSum.negated() : withdrawSum;

  let openPositionsValue = toDec(0);
  for (const pos of positions) {
    if (pos.market.status === MarketStatus.RESOLVED) continue;
    openPositionsValue = openPositionsValue.plus(
      pos.quantity.mul(pos.avgEntryPrice),
    );
  }

  const realizedPnl = portfolio?.realizedPnlUsd ?? toDec(0);
  const available = deposits.minus(withdrawals).minus(openPositionsValue).plus(realizedPnl);
  const locked = openPositionsValue;
  const total = available.plus(locked);

  return {
    userId,
    depositsUsd: deposits.toFixed(),
    withdrawalsUsd: withdrawals.toFixed(),
    openPositionsValueUsd: openPositionsValue.toFixed(),
    realizedPnlUsd: realizedPnl.toFixed(),
    availableBalanceUsd: available.toFixed(),
    lockedBalanceUsd: locked.toFixed(),
    totalBalanceUsd: total.toFixed(),
  };
}

/** Keep custodial `Wallet` row aligned with ledger-derived balances. */
export async function reconcileWalletFromLedger(
  userId: string,
  db: Tx | typeof prisma = prisma,
): Promise<WalletBalanceComponents> {
  const components = await computeWalletBalanceComponents(userId, db);

  const existing = await db.wallet.findUnique({ where: { userId } });
  if (existing) {
    await db.wallet.update({
      where: { userId },
      data: {
        availableBalance: toDec(components.availableBalanceUsd),
        lockedBalance: toDec(components.lockedBalanceUsd),
      },
    });
  }

  return components;
}
