import { prisma } from "@orakly/database";
import { OutcomeSide, Prisma } from "@prisma/client";

export type MarketRiskLevel = "NORMAL" | "HIGH";

export type ManipulationAnalysis = {
  marketId: string;
  riskLevel: MarketRiskLevel;
  volatile: boolean;
  flaggedWallets: string[];
  walletWeightMultiplier: Map<string, number>;
  throttledWallets: string[];
};

const WHALE_SHARE_THRESHOLD = 0.2;
const WASH_CYCLE_MS = 60_000;
const SPIKE_RATIO_THRESHOLD = 2.5;
const FLAGGED_WEIGHT = 0.4;

function toNum(d: Prisma.Decimal | null | undefined): number {
  if (!d) return 0;
  return Number(d);
}

function detectWhales(
  trades: Array<{
    buyerId: string;
    notionalUsd: Prisma.Decimal;
    executedAt: Date;
  }>,
  oneHourAgo: number,
): Set<string> {
  const hourTrades = trades.filter(
    (t) => t.executedAt.getTime() >= oneHourAgo,
  );
  const pool = hourTrades.length > 0 ? hourTrades : trades;
  const total = pool.reduce((s, t) => s + toNum(t.notionalUsd), 0);
  if (total <= 0) return new Set();

  const byWallet = new Map<string, number>();
  for (const t of pool) {
    byWallet.set(
      t.buyerId,
      (byWallet.get(t.buyerId) ?? 0) + toNum(t.notionalUsd),
    );
  }

  const flagged = new Set<string>();
  for (const [walletId, vol] of byWallet) {
    if (vol / total > WHALE_SHARE_THRESHOLD) flagged.add(walletId);
  }
  return flagged;
}

function detectWashTrading(
  trades: Array<{
    buyerId: string;
    sellerId: string;
    outcome: OutcomeSide;
    executedAt: Date;
  }>,
): Set<string> {
  const flagged = new Set<string>();
  const byWallet = new Map<string, typeof trades>();

  for (const t of trades) {
    for (const walletId of [t.buyerId, t.sellerId]) {
      const list = byWallet.get(walletId) ?? [];
      list.push(t);
      byWallet.set(walletId, list);
    }
  }

  for (const [walletId, list] of byWallet) {
    const sorted = [...list].sort(
      (a, b) => a.executedAt.getTime() - b.executedAt.getTime(),
    );
    let alternations = 0;
    let lastSide: OutcomeSide | null = null;
    let lastAt = 0;

    for (const t of sorted) {
      const side = t.buyerId === walletId ? t.outcome : t.outcome;
      const at = t.executedAt.getTime();
      if (lastSide && side !== lastSide && at - lastAt < WASH_CYCLE_MS) {
        alternations += 1;
      }
      lastSide = side;
      lastAt = at;
    }
    if (alternations >= 2) flagged.add(walletId);
  }

  return flagged;
}

function detectVolumeSpike(
  trades: Array<{ notionalUsd: Prisma.Decimal; executedAt: Date }>,
): boolean {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const recent = trades
    .filter((t) => t.executedAt.getTime() >= fiveMinAgo)
    .reduce((s, t) => s + toNum(t.notionalUsd), 0);
  const older = trades
    .filter((t) => t.executedAt.getTime() < fiveMinAgo)
    .reduce((s, t) => s + toNum(t.notionalUsd), 0);
  if (older <= 0) return false;
  return recent / older > SPIKE_RATIO_THRESHOLD;
}

export async function analyzeMarketManipulation(
  marketId: string,
): Promise<ManipulationAnalysis> {
  const trades = await prisma.trade.findMany({
    where: { marketId },
    select: {
      buyerId: true,
      sellerId: true,
      outcome: true,
      notionalUsd: true,
      executedAt: true,
    },
    orderBy: { executedAt: "desc" },
    take: 500,
  });

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const whales = detectWhales(trades, oneHourAgo);
  const wash = detectWashTrading(trades);
  const volatile = detectVolumeSpike(trades);

  const flaggedWallets = [...new Set([...whales, ...wash])];
  const walletWeightMultiplier = new Map<string, number>();
  for (const w of flaggedWallets) {
    walletWeightMultiplier.set(w, FLAGGED_WEIGHT);
  }

  const riskLevel: MarketRiskLevel =
    flaggedWallets.length > 0 || volatile ? "HIGH" : "NORMAL";

  if (riskLevel === "HIGH" || volatile) {
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: { generationMeta: true },
    });
    const meta =
      typeof market?.generationMeta === "object" && market.generationMeta
        ? (market.generationMeta as Record<string, unknown>)
        : {};

    await prisma.market.update({
      where: { id: marketId },
      data: {
        generationMeta: {
          ...meta,
          riskLevel,
          volatile,
          flaggedWallets,
          manipulationCheckedAt: new Date().toISOString(),
        },
      },
    });
  }

  return {
    marketId,
    riskLevel,
    volatile,
    flaggedWallets,
    walletWeightMultiplier,
    throttledWallets: flaggedWallets,
  };
}

export function applyWalletWeight(
  baseWeight: number,
  walletId: string,
  analysis: ManipulationAnalysis,
): number {
  const mult = analysis.walletWeightMultiplier.get(walletId);
  return mult != null ? baseWeight * mult : baseWeight;
}
