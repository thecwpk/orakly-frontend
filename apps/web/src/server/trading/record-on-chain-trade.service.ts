import {
  ActivityType,
  type OutcomeSide,
  Prisma,
} from "@prisma/client";
import { prisma } from "@orakly/database";
import { toDec } from "./constants";
import { TradingError } from "./errors";
import { ensurePlatformLiquidityUserId } from "./platform-user";
import { publishTradeRealtime } from "../realtime/notify";
import type { TradeDirection, TradeExecutionSnapshot } from "./trade.service";

export type RecordOnChainTradeInput = {
  userId: string;
  marketId: string;
  outcome: OutcomeSide;
  direction: TradeDirection;
  price: string;
  quantity: string;
  notionalUsd: string;
  feeUsd?: string;
  txHash: string;
};

function externalRefForTx(txHash: string): string {
  return `chain:${txHash.trim().toLowerCase()}`;
}

function toSnapshot(input: {
  tradeId: string;
  marketId: string;
  outcome: OutcomeSide;
  direction: TradeDirection;
  price: Prisma.Decimal;
  quantity: Prisma.Decimal;
  notionalUsd: Prisma.Decimal;
  feeUsd: Prisma.Decimal;
  yesPrice: Prisma.Decimal;
  noPrice: Prisma.Decimal;
  liquidityUsd: Prisma.Decimal;
  collateralPoolUsd: Prisma.Decimal;
  volumeTotalUsd: Prisma.Decimal;
  volume24hUsd: Prisma.Decimal;
}): TradeExecutionSnapshot {
  return {
    tradeId: input.tradeId,
    marketId: input.marketId,
    outcome: input.outcome,
    direction: input.direction,
    executedPrice: input.price.toFixed(),
    quantity: input.quantity.toFixed(),
    notionalUsd: input.notionalUsd.toFixed(),
    feeUsd: input.feeUsd.toFixed(),
    walletAvailableUsd: "0",
    odds: {
      yesPrice: input.yesPrice.toFixed(),
      noPrice: input.noPrice.toFixed(),
    },
    liquidityUsd: input.liquidityUsd.toFixed(),
    collateralPoolUsd: input.collateralPoolUsd.toFixed(),
    volumeTotalUsd: input.volumeTotalUsd.toFixed(),
    volume24hUsd: input.volume24hUsd.toFixed(),
  };
}

/**
 * Persists an on-chain MetaMask fill for activity tape + leaderboard.
 * Does not move custodial balances — chain settlement already happened.
 */
export async function recordOnChainTrade(
  input: RecordOnChainTradeInput,
): Promise<TradeExecutionSnapshot> {
  const externalRef = externalRefForTx(input.txHash);
  const platformUserId = await ensurePlatformLiquidityUserId();

  const existing = await prisma.trade.findUnique({
    where: { externalRef },
    include: {
      market: {
        select: {
          id: true,
          yesPrice: true,
          noPrice: true,
          liquidityUsd: true,
          collateralPoolUsd: true,
          volumeTotalUsd: true,
          volume24hUsd: true,
        },
      },
    },
  });

  if (existing) {
    const direction: TradeDirection =
      existing.takerId === existing.buyerId ? "BUY" : "SELL";
    return toSnapshot({
      tradeId: existing.id,
      marketId: existing.marketId,
      outcome: existing.outcome,
      direction,
      price: existing.price,
      quantity: existing.quantity,
      notionalUsd: existing.notionalUsd,
      feeUsd: existing.feeBuyerUsd.add(existing.feeSellerUsd),
      yesPrice: existing.market.yesPrice ?? toDec(0.5),
      noPrice: existing.market.noPrice ?? toDec(0.5),
      liquidityUsd: existing.market.liquidityUsd,
      collateralPoolUsd: existing.market.collateralPoolUsd,
      volumeTotalUsd: existing.market.volumeTotalUsd,
      volume24hUsd: existing.market.volume24hUsd,
    });
  }

  const price = toDec(input.price);
  const quantity = toDec(input.quantity);
  const notional = toDec(input.notionalUsd);
  const fee = toDec(input.feeUsd ?? "0");

  if (price.lessThanOrEqualTo(0) || quantity.lessThanOrEqualTo(0)) {
    throw new TradingError("INVALID_QUOTE", "Trade price and quantity must be positive", 400);
  }

  const snapshot = await prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({
      where: { id: input.marketId },
      select: {
        id: true,
        yesPrice: true,
        noPrice: true,
        liquidityUsd: true,
        collateralPoolUsd: true,
        volumeTotalUsd: true,
        volume24hUsd: true,
      },
    });

    if (!market) {
      throw new TradingError("NOT_FOUND", "Market not found", 404);
    }

    const buyerId = input.direction === "BUY" ? input.userId : platformUserId;
    const sellerId = input.direction === "BUY" ? platformUserId : input.userId;
    const executedAt = new Date();

    const updated = await tx.market.update({
      where: { id: market.id },
      data: {
        volumeTotalUsd: { increment: notional },
        volume24hUsd: { increment: notional },
      },
      select: {
        yesPrice: true,
        noPrice: true,
        liquidityUsd: true,
        collateralPoolUsd: true,
        volumeTotalUsd: true,
        volume24hUsd: true,
      },
    });

    const trade = await tx.trade.create({
      data: {
        marketId: market.id,
        outcome: input.outcome,
        price,
        quantity,
        notionalUsd: notional,
        buyerId,
        sellerId,
        takerId: input.userId,
        makerId: platformUserId,
        feeBuyerUsd: input.direction === "BUY" ? fee : new Prisma.Decimal(0),
        feeSellerUsd: input.direction === "SELL" ? fee : new Prisma.Decimal(0),
        executedAt,
        externalRef,
      },
    });

    await tx.activity.create({
      data: {
        type: ActivityType.TRADE,
        userId: input.userId,
        marketId: market.id,
        tradeId: trade.id,
        title: `${input.direction} ${input.outcome}`,
        payload: {
          direction: input.direction,
          outcome: input.outcome,
          side: input.direction,
          price: price.toFixed(),
          quantity: quantity.toFixed(),
          notionalUsd: notional.toFixed(),
          tradeId: trade.id,
          txHash: input.txHash,
          source: "on_chain",
        },
      },
    });

    return toSnapshot({
      tradeId: trade.id,
      marketId: market.id,
      outcome: input.outcome,
      direction: input.direction,
      price,
      quantity,
      notionalUsd: notional,
      feeUsd: fee,
      yesPrice: updated.yesPrice ?? toDec(0.5),
      noPrice: updated.noPrice ?? toDec(0.5),
      liquidityUsd: updated.liquidityUsd,
      collateralPoolUsd: updated.collateralPoolUsd,
      volumeTotalUsd: updated.volumeTotalUsd,
      volume24hUsd: updated.volume24hUsd,
    });
  });

  publishTradeRealtime(snapshot, input.userId);
  return snapshot;
}
