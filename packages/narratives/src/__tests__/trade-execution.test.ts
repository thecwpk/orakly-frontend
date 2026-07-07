import { describe, expect, it, vi, beforeEach } from "vitest";
import { LedgerEntryType, MarketStatus, OutcomeSide, Prisma } from "./test-prisma.js";

const recordFinancialEntryMock = vi.hoisted(() => vi.fn(async () => ({ id: "le1" })));

vi.mock("../ledger.service.js", () => ({
  recordFinancialEntry: recordFinancialEntryMock,
}));
vi.mock("../engines/probabilityEngine.service.js", () => ({
  applyMarketProbability: vi.fn(async () => ({
    marketId: "m1",
    probability: 0.55,
    probabilityPct: 55,
    ammRatio: 0.5,
    orderRatio: 0.5,
    forVolume: 100,
    againstVolume: 80,
    degraded: false,
    smoothed: true,
  })),
}));
vi.mock("../events/eventBus.service.js", () => ({
  eventBus: { emit: vi.fn(async () => {}) },
  SystemEvents: {
    TRADE_CREATED: "TRADE_CREATED",
    PROBABILITY_UPDATED: "PROBABILITY_UPDATED",
    LEDGER_UPDATED: "LEDGER_UPDATED",
  },
}));
vi.mock("../infra/lock.service.js", () => ({
  withMarketLock: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
}));
vi.mock("../security/fraudShield.service.js", () => ({
  assertTradeAllowed: vi.fn(async () => {}),
  FraudShieldError: class FraudShieldError extends Error {},
}));
vi.mock("../walletBalance.service.js", () => ({
  computeWalletBalanceComponents: vi.fn(async () => ({
    availableBalanceUsd: "900",
  })),
  reconcileWalletFromLedger: vi.fn(async () => ({
    availableBalanceUsd: "900",
  })),
}));

const marketRow = {
  id: "m1",
  status: MarketStatus.OPEN,
  opensAt: new Date(Date.now() - 60_000),
  closesAt: new Date(Date.now() + 86_400_000),
  yesPrice: new Prisma.Decimal(0.5),
  noPrice: new Prisma.Decimal(0.5),
  liquidityUsd: new Prisma.Decimal(5000),
  collateralPoolUsd: new Prisma.Decimal(5000),
  volumeTotalUsd: new Prisma.Decimal(0),
  volume24hUsd: new Prisma.Decimal(0),
  takerFeeBps: 200,
};

const txMock = vi.hoisted(() => ({
  trade: {
    findUnique: vi.fn(async () => null),
    create: vi.fn(async () => ({ id: "t1" })),
  },
  user: {
    findUnique: vi.fn(async () => ({ id: "u1", isSuspended: false })),
  },
  platformFee: { create: vi.fn(async () => ({})) },
  wallet: {
    findUnique: vi.fn(async () => ({
      id: "w-platform",
      availableBalance: new Prisma.Decimal(10000),
    })),
    update: vi.fn(async () => ({})),
  },
  market: {
    findUnique: vi.fn(async () => marketRow),
    findUniqueOrThrow: vi.fn(async () => ({
      ...marketRow,
      yesPrice: new Prisma.Decimal(0.52),
      noPrice: new Prisma.Decimal(0.48),
    })),
    updateMany: vi.fn(async () => ({ count: 1 })),
    update: vi.fn(async () => ({})),
  },
  activity: { create: vi.fn(async () => ({})) },
  idempotencyKey: {
    findUnique: vi.fn(async () => null),
    create: vi.fn(async () => ({})),
  },
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock)),
}));

vi.mock("@orakly/database", () => ({ prisma: prismaMock }));

vi.mock("../trading/user-setup.js", () => ({
  ensureWalletAndPortfolio: vi.fn(async (userId: string) => ({
    wallet: { id: "w1", availableBalance: new Prisma.Decimal(1000) },
    portfolio: { id: "p1", userId },
  })),
}));
vi.mock("../trading/platform-user.js", () => ({
  requirePlatformLiquidityUserId: vi.fn(() => "platform-user"),
}));
vi.mock("../trading/positions.js", () => ({
  increasePosition: vi.fn(async () => {}),
  decreasePosition: vi.fn(async () => {}),
}));
vi.mock("../trading/wallet-ops.js", () => ({
  creditWallet: vi.fn(async () => {}),
}));

import { executeMarketTrade } from "../trading/marketTrade.service.js";

describe("trade execution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordFinancialEntryMock.mockClear();
  });

  it("executes BUY and records unified ledger entry", async () => {
    const qty = new Prisma.Decimal(10);

    const snapshot = await executeMarketTrade({
      userId: "u1",
      marketId: "m1",
      outcome: OutcomeSide.YES,
      direction: "BUY",
      quantity: qty,
    });

    expect(snapshot.tradeId).toBe("t1");
    expect(snapshot.direction).toBe("BUY");
    expect(recordFinancialEntryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "u1",
        type: LedgerEntryType.TRADE,
        marketId: "m1",
        tradeId: "t1",
        portfolioId: "p1",
      }),
    );
  });
});
