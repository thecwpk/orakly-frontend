import { describe, expect, it, vi, beforeEach } from "vitest";
import { LedgerEntryType, MarketStatus, Prisma } from "./test-prisma.js";
import { computeWalletBalanceComponents } from "../walletBalance.service.js";

function toDec(v: string | number): Prisma.Decimal {
  return new Prisma.Decimal(v);
}

function mockDb(overrides: {
  deposits?: string;
  withdrawals?: string;
  realizedPnl?: string;
  positions?: Array<{
    quantity: string;
    avgEntryPrice: string;
    status: MarketStatus;
  }>;
}) {
  const deposits = toDec(overrides.deposits ?? "1000");
  const withdrawals = toDec(overrides.withdrawals ?? "0");
  const realizedPnl = toDec(overrides.realizedPnl ?? "50");
  const positions = overrides.positions ?? [];

  return {
    ledgerEntry: {
      aggregate: vi.fn(async ({ where }: { where: { type: LedgerEntryType } }) => {
        if (where.type === LedgerEntryType.DEPOSIT) {
          return { _sum: { amount: deposits } };
        }
        if (where.type === LedgerEntryType.WITHDRAW) {
          return { _sum: { amount: withdrawals.negated() } };
        }
        return { _sum: { amount: toDec(0) } };
      }),
    },
    portfolio: {
      findUnique: vi.fn(async () => ({
        realizedPnlUsd: realizedPnl,
      })),
    },
    position: {
      findMany: vi.fn(async () =>
        positions.map((p) => ({
          quantity: toDec(p.quantity),
          avgEntryPrice: toDec(p.avgEntryPrice),
          market: { status: p.status },
        })),
      ),
    },
  };
}

describe("computeWalletBalanceComponents", () => {
  it("reconciles deposits minus withdrawals plus pnl minus open positions", async () => {
    const db = mockDb({
      deposits: "1000",
      withdrawals: "100",
      realizedPnl: "75",
      positions: [
        { quantity: "10", avgEntryPrice: "0.5", status: MarketStatus.OPEN },
      ],
    });

    const result = await computeWalletBalanceComponents("user-1", db as never);

    expect(result.depositsUsd).toBe("1000");
    expect(result.withdrawalsUsd).toBe("100");
    expect(result.openPositionsValueUsd).toBe("5");
    expect(result.realizedPnlUsd).toBe("75");
    expect(result.availableBalanceUsd).toBe("970");
    expect(result.lockedBalanceUsd).toBe("5");
    expect(result.totalBalanceUsd).toBe("975");
  });

  it("ignores resolved market positions in open value", async () => {
    const db = mockDb({
      deposits: "500",
      realizedPnl: "0",
      positions: [
        { quantity: "20", avgEntryPrice: "0.6", status: MarketStatus.RESOLVED },
      ],
    });

    const result = await computeWalletBalanceComponents("user-2", db as never);
    expect(result.openPositionsValueUsd).toBe("0");
    expect(result.availableBalanceUsd).toBe("500");
  });
});
