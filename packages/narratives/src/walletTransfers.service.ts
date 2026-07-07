import { prisma } from "@orakly/database";
import { LedgerEntryType, Prisma } from "@prisma/client";
import { eventBus, SystemEvents } from "./events/eventBus.service.js";
import { appendLedgerEntry } from "./ledger.service.js";
import { reconcileWalletFromLedger } from "./walletBalance.service.js";

function toDec(v: string | number): Prisma.Decimal {
  return new Prisma.Decimal(v);
}

export class WalletTransferError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "WalletTransferError";
    this.code = code;
    this.status = status;
  }
}

export type WalletTransferResult = {
  userId: string;
  type: "DEPOSIT" | "WITHDRAW";
  amountUsd: string;
  txHash: string | null;
  balance: Awaited<ReturnType<typeof reconcileWalletFromLedger>>;
};

async function ensureWallet(userId: string, tx: Prisma.TransactionClient) {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user || user.isSuspended) {
    throw new WalletTransferError("FORBIDDEN", "User cannot transfer", 403);
  }

  let wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await tx.wallet.create({
      data: { userId, availableBalance: 0, lockedBalance: 0 },
    });
  }

  let portfolio = await tx.portfolio.findUnique({ where: { userId } });
  if (!portfolio) {
    await tx.portfolio.create({ data: { userId } });
  }

  return wallet;
}

export async function depositFunds(input: {
  userId: string;
  amountUsd: number | string;
  txHash?: string | null;
}): Promise<WalletTransferResult> {
  const amount = toDec(input.amountUsd);
  if (amount.lessThanOrEqualTo(0)) {
    throw new WalletTransferError("VALIDATION", "amountUsd must be positive");
  }

  await prisma.$transaction(async (tx) => {
    await ensureWallet(input.userId, tx);
    await appendLedgerEntry(tx, {
      userId: input.userId,
      type: LedgerEntryType.DEPOSIT,
      amount,
      txHash: input.txHash ?? null,
    });
    await reconcileWalletFromLedger(input.userId, tx);
  });

  const balance = await reconcileWalletFromLedger(input.userId);

  await eventBus.emit(SystemEvents.LEDGER_UPDATED, {
    userId: input.userId,
    type: LedgerEntryType.DEPOSIT,
    amount: amount.toFixed(),
    txHash: input.txHash ?? null,
  });

  return {
    userId: input.userId,
    type: "DEPOSIT",
    amountUsd: amount.toFixed(),
    txHash: input.txHash ?? null,
    balance,
  };
}

export async function withdrawFunds(input: {
  userId: string;
  amountUsd: number | string;
  txHash?: string | null;
}): Promise<WalletTransferResult> {
  const amount = toDec(input.amountUsd);
  if (amount.lessThanOrEqualTo(0)) {
    throw new WalletTransferError("VALIDATION", "amountUsd must be positive");
  }

  const components = await reconcileWalletFromLedger(input.userId);
  const available = toDec(components.availableBalanceUsd);
  if (available.lessThan(amount)) {
    throw new WalletTransferError("INSUFFICIENT_FUNDS", "Insufficient available balance");
  }

  await prisma.$transaction(async (tx) => {
    await ensureWallet(input.userId, tx);
    await appendLedgerEntry(tx, {
      userId: input.userId,
      type: LedgerEntryType.WITHDRAW,
      amount: amount.negated(),
      txHash: input.txHash ?? null,
    });
    await reconcileWalletFromLedger(input.userId, tx);
  });

  const balance = await reconcileWalletFromLedger(input.userId);

  await eventBus.emit(SystemEvents.LEDGER_UPDATED, {
    userId: input.userId,
    type: LedgerEntryType.WITHDRAW,
    amount: amount.negated().toFixed(),
    txHash: input.txHash ?? null,
  });

  return {
    userId: input.userId,
    type: "WITHDRAW",
    amountUsd: amount.toFixed(),
    txHash: input.txHash ?? null,
    balance,
  };
}
