import { describe, expect, it, vi, beforeEach } from "vitest";
import { LedgerEntryType, MarketStatus, OutcomeSide, Prisma } from "./test-prisma.js";

const recordFinancialEntryMock = vi.hoisted(() => vi.fn(async () => ({ id: "le1" })));

vi.mock("../ledger.service.js", () => ({
  recordFinancialEntry: recordFinancialEntryMock,
}));
vi.mock("../infra/lock.service.js", () => ({
  withMarketLock: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
}));
vi.mock("../engines/positionEngine.service.js", () => ({
  syncPortfolioRealizedPnl: vi.fn(async () => {}),
}));
vi.mock("../events/eventBus.service.js", () => ({
  eventBus: { emit: vi.fn(async () => {}) },
  SystemEvents: { LEDGER_UPDATED: "LEDGER_UPDATED" },
}));
vi.mock("../walletBalance.service.js", () => ({
  reconcileWalletFromLedger: vi.fn(async () => ({
    availableBalanceUsd: "1010",
  })),
}));

const prismaMock = vi.hoisted(() => ({
  market: { findUnique: vi.fn(), update: vi.fn() },
  position: { findMany: vi.fn() },
  $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock)),
}));

const txMock = vi.hoisted(() => ({
  wallet: {
    findUnique: vi.fn(async () => ({
      id: "w1",
      availableBalance: new Prisma.Decimal(1000),
    })),
    update: vi.fn(async () => ({})),
  },
  market: { update: vi.fn(async () => ({})) },
}));

vi.mock("@orakly/database", () => ({ prisma: prismaMock }));

import { processMarketPayout } from "../workers/payout.worker.js";
import { eventBus } from "../events/eventBus.service.js";

describe("payout flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordFinancialEntryMock.mockClear();
  });

  it("credits winners and writes PNL ledger entries", async () => {
    prismaMock.market.findUnique.mockResolvedValue({
      id: "m1",
      status: MarketStatus.RESOLVED,
      resolvedOutcome: OutcomeSide.YES,
      generationMeta: {},
    });
    prismaMock.position.findMany.mockResolvedValue([
      {
        side: OutcomeSide.YES,
        quantity: new Prisma.Decimal(10),
        portfolioId: "p1",
        portfolio: { userId: "u1" },
      },
      {
        side: OutcomeSide.NO,
        quantity: new Prisma.Decimal(5),
        portfolioId: "p2",
        portfolio: { userId: "u2" },
      },
    ]);

    const result = await processMarketPayout("m1");

    expect(result.payouts).toBe(1);
    expect(result.totalUsd).toBe("10");
    expect(recordFinancialEntryMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "u1",
        type: LedgerEntryType.PNL,
        amount: expect.any(Prisma.Decimal),
        marketId: "m1",
        portfolioId: "p1",
      }),
    );
    expect(eventBus.emit).toHaveBeenCalled();
    expect(txMock.market.update).toHaveBeenCalled();
  });

  it("skips already-processed markets", async () => {
    prismaMock.market.findUnique.mockResolvedValue({
      id: "m2",
      status: MarketStatus.RESOLVED,
      resolvedOutcome: OutcomeSide.YES,
      generationMeta: { payoutProcessed: true },
    });

    const result = await processMarketPayout("m2");
    expect(result.payouts).toBe(0);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
