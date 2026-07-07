import { describe, expect, it, vi, beforeEach } from "vitest";
import { MarketStatus, OutcomeSide, ResolutionStatus } from "./test-prisma.js";

vi.mock("../lib/http-client.js", () => ({
  fetchJsonWithRetry: vi.fn(async () => []),
}));
vi.mock("../externalApis/coingecko.service.js", () => ({
  getAllCoingeckoNarratives: vi.fn(async () => [
    { narrative: "DeFi", momentum: 90 },
  ]),
}));
vi.mock("../externalApis/cryptopanic.service.js", () => ({
  getNews: vi.fn(async () => [{ narrative: "DeFi", mentionScore: 85 }]),
}));
vi.mock("../externalApis/reddit.service.js", () => ({
  getCryptoPosts: vi.fn(async () => [{ narrative: "DeFi", engagementScore: 80 }]),
}));
vi.mock("../externalApis/defillama.service.js", () => ({
  getAllDefiLlamaNarratives: vi.fn(async () => [
    { narrative: "DeFi", tvlGrowthPercent: 10 },
  ]),
}));

const prismaMock = vi.hoisted(() => ({
  market: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  attentionScore: {
    findUnique: vi.fn(),
  },
  apiLog: {
    create: vi.fn(async () => ({})),
  },
}));

vi.mock("@orakly/database", () => ({ prisma: prismaMock }));
vi.mock("../infra/lock.service.js", () => ({
  withMarketLock: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
}));
vi.mock("../workers/payout.queue.js", () => ({
  enqueueMarketPayout: vi.fn(async () => {}),
}));
vi.mock("../events/eventBus.service.js", () => ({
  eventBus: { emit: vi.fn(async () => {}) },
  SystemEvents: { MARKET_RESOLVED: "MARKET_RESOLVED" },
}));

import { evaluateMarketResolution } from "../engines/resolutionEngine.service.js";

describe("market resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves market when 2+ evidence sources agree on FOR", async () => {
    prismaMock.market.findUnique.mockResolvedValue({
      id: "m1",
      title: "Will DeFi grow?",
      status: MarketStatus.OPEN,
      generationMeta: { narrative: "DeFi" },
      category: { name: "DeFi", slug: "defi" },
    });
    prismaMock.market.update.mockResolvedValue({});

    const decision = await evaluateMarketResolution("m1");

    expect(decision).not.toBeNull();
    expect(decision?.status).toBe("RESOLVED");
    expect(decision?.winner).toBe("FOR");
    expect(decision?.verification.agreeCount).toBeGreaterThanOrEqual(2);
    expect(prismaMock.market.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "m1" },
        data: expect.objectContaining({
          status: MarketStatus.RESOLVED,
          resolvedOutcome: OutcomeSide.YES,
        }),
      }),
    );
  });

  it("marks pending review when sources disagree", async () => {
    const { getAllCoingeckoNarratives } = await import(
      "../externalApis/coingecko.service.js"
    );
    vi.mocked(getAllCoingeckoNarratives).mockResolvedValueOnce([
      { narrative: "DeFi", momentum: 10, source: "coingecko", volume: 0 },
    ]);

    prismaMock.market.findUnique.mockResolvedValue({
      id: "m2",
      title: "DeFi narrative",
      status: MarketStatus.OPEN,
      generationMeta: { narrative: "DeFi" },
      category: null,
    });
    prismaMock.market.update.mockResolvedValue({});

    const decision = await evaluateMarketResolution("m2");

    expect(decision?.status).toBe("PENDING_REVIEW");
    expect(decision?.winner).toBeNull();
    expect(prismaMock.market.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resolutionStatus: ResolutionStatus.PENDING_REVIEW,
        }),
      }),
    );
  });
});
