import { prisma } from "@orakly/database";
import { LedgerEntryType, Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type LedgerEntryDto = {
  id: string;
  userId: string;
  type: LedgerEntryType;
  amount: string;
  balanceAfter: string | null;
  txHash: string | null;
  timestamp: string;
  marketId: string | null;
  tradeId: string | null;
};

export type RecordFinancialEntryInput = {
  userId: string;
  type: LedgerEntryType;
  amount: Prisma.Decimal | string | number;
  portfolioId?: string | null;
  marketId?: string | null;
  tradeId?: string | null;
  balanceAfter?: Prisma.Decimal | string | number | null;
  metadata?: Prisma.InputJsonValue;
  txHash?: string | null;
  timestamp?: Date;
};

/** Canonical financial write — replaces legacy Transaction.create + bare LedgerEntry. */
export async function recordFinancialEntry(
  tx: Tx,
  input: RecordFinancialEntryInput,
): Promise<{ id: string }> {
  const row = await tx.ledgerEntry.create({
    data: {
      userId: input.userId,
      type: input.type,
      amount: new Prisma.Decimal(input.amount),
      portfolioId: input.portfolioId ?? null,
      marketId: input.marketId ?? null,
      tradeId: input.tradeId ?? null,
      balanceAfter:
        input.balanceAfter != null
          ? new Prisma.Decimal(input.balanceAfter)
          : null,
      metadata: input.metadata ?? undefined,
      txHash: input.txHash ?? null,
      ...(input.timestamp ? { timestamp: input.timestamp } : {}),
    },
  });
  return { id: row.id };
}

/** @deprecated Use recordFinancialEntry */
export async function appendLedgerEntry(
  tx: Tx,
  input: Omit<RecordFinancialEntryInput, "portfolioId" | "marketId" | "tradeId" | "balanceAfter" | "metadata">,
): Promise<void> {
  await recordFinancialEntry(tx, input);
}

export async function listUserLedgerEntries(
  userId: string,
  options?: { limit?: number; offset?: number },
): Promise<LedgerEntryDto[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const offset = Math.max(options?.offset ?? 0, 0);

  const rows = await prisma.ledgerEntry.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: limit,
    skip: offset,
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    type: row.type,
    amount: row.amount.toFixed(),
    balanceAfter: row.balanceAfter?.toFixed() ?? null,
    txHash: row.txHash,
    timestamp: row.timestamp.toISOString(),
    marketId: row.marketId,
    tradeId: row.tradeId,
  }));
}
