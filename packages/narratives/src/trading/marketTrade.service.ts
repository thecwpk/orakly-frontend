import { prisma } from "@orakly/database";
import {
  ActivityType,
  LedgerEntryType,
  MarketStatus,
  type OutcomeSide,
  Prisma,
} from "@prisma/client";
import { recordFinancialEntry } from "../ledger.service.js";
import { applyMarketProbability } from "../engines/probabilityEngine.service.js";
import type { MarketProbabilityResult } from "../engines/probabilityEngine.service.js";
import { eventBus, SystemEvents } from "../events/eventBus.service.js";
import { withMarketLock } from "../infra/lock.service.js";
import {
  assertTradeAllowed,
  FraudShieldError,
} from "../security/fraudShield.service.js";
import {
  computeWalletBalanceComponents,
  reconcileWalletFromLedger,
} from "../walletBalance.service.js";
import { BPS_DENOMINATOR, clampPrice, D1, toDec } from "./constants.js";
import { MarketTradeError } from "./errors.js";

export { MarketTradeError } from "./errors.js";
import { computeExecutionPrice } from "./pricing.js";
import { requirePlatformLiquidityUserId } from "./platform-user.js";
import { decreasePosition, increasePosition } from "./positions.js";
import { ensureWalletAndPortfolio } from "./user-setup.js";
import { creditWallet } from "./wallet-ops.js";

const MIN_QTY = toDec("0.00000001");
const MAX_QTY = toDec("1000000000");

export type TradeDirection = "BUY" | "SELL";

export type ExecuteMarketTradeInput = {
  userId: string;
  marketId: string;
  outcome: OutcomeSide;
  direction: TradeDirection;
  quantity: Prisma.Decimal;
  clientSeq?: number;
  idempotencyKey?: string | null;
};

export type TradeExecutionSnapshot = {
  tradeId: string;
  marketId: string;
  outcome: OutcomeSide;
  direction: TradeDirection;
  executedPrice: string;
  quantity: string;
  notionalUsd: string;
  feeUsd: string;
  walletAvailableUsd: string;
  odds: { yesPrice: string; noPrice: string };
  liquidityUsd: string;
  collateralPoolUsd: string;
  volumeTotalUsd: string;
  volume24hUsd: string;
  clientSeq?: number;
};

type TxResult = {
  snapshot: TradeExecutionSnapshot;
  probResult: MarketProbabilityResult;
  ledgerAmount: string;
  replayed: boolean;
};

function externalRefFor(userId: string, key: string): string {
  return `trade:${userId}:${key}`;
}

function assertTradableMarket(m: {
  status: MarketStatus;
  opensAt: Date | null;
  closesAt: Date | null;
}) {
  if (m.status !== MarketStatus.OPEN) {
    throw new MarketTradeError("MARKET_CLOSED", "Market is not open for trading", 400);
  }
  const now = new Date();
  if (m.opensAt && now < m.opensAt) {
    throw new MarketTradeError("MARKET_NOT_OPEN", "Market has not opened yet", 400);
  }
  if (m.closesAt && now > m.closesAt) {
    throw new MarketTradeError("MARKET_CLOSED", "Market trading window has ended", 400);
  }
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
  walletAvailable: Prisma.Decimal;
  yesPrice: Prisma.Decimal;
  noPrice: Prisma.Decimal;
  liquidityUsd: Prisma.Decimal;
  collateralPoolUsd: Prisma.Decimal;
  volumeTotalUsd: Prisma.Decimal;
  volume24hUsd: Prisma.Decimal;
  clientSeq?: number;
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
    walletAvailableUsd: input.walletAvailable.toFixed(),
    odds: {
      yesPrice: input.yesPrice.toFixed(),
      noPrice: input.noPrice.toFixed(),
    },
    liquidityUsd: input.liquidityUsd.toFixed(),
    collateralPoolUsd: input.collateralPoolUsd.toFixed(),
    volumeTotalUsd: input.volumeTotalUsd.toFixed(),
    volume24hUsd: input.volume24hUsd.toFixed(),
    clientSeq: input.clientSeq,
  };
}

async function executeMarketTradeInner(
  input: ExecuteMarketTradeInput,
): Promise<TxResult> {
  if (input.quantity.lessThan(MIN_QTY) || input.quantity.greaterThan(MAX_QTY)) {
    throw new MarketTradeError("INVALID_QUANTITY", "Quantity out of allowed bounds", 400);
  }

  const platformUserId = requirePlatformLiquidityUserId();
  if (input.userId === platformUserId) {
    throw new MarketTradeError(
      "INVALID_ACTOR",
      "Platform liquidity account cannot trade as a user",
      400,
    );
  }

  await assertTradeAllowed(input.userId, input.marketId);

  const idemRef =
    input.idempotencyKey?.trim()
      ? externalRefFor(input.userId, input.idempotencyKey.trim())
      : null;

  let replayed = false;

  const txResult = await prisma.$transaction(
    async (tx) => {
      if (idemRef) {
        const existing = await tx.trade.findUnique({
          where: { externalRef: idemRef },
        });
        if (existing) {
          replayed = true;
          const market = await tx.market.findUniqueOrThrow({
            where: { id: existing.marketId },
          });
          const bal = await computeWalletBalanceComponents(input.userId, tx);
          const yesMid = market.yesPrice ?? new Prisma.Decimal("0.5");
          const noMid = market.noPrice ?? clampPrice(D1.minus(yesMid));
          const snap = toSnapshot({
            tradeId: existing.id,
            marketId: existing.marketId,
            outcome: existing.outcome,
            direction: existing.buyerId === input.userId ? "BUY" : "SELL",
            price: existing.price,
            quantity: existing.quantity,
            notionalUsd: existing.notionalUsd,
            feeUsd: existing.feeBuyerUsd.plus(existing.feeSellerUsd),
            walletAvailable: toDec(bal.availableBalanceUsd),
            yesPrice: yesMid,
            noPrice: noMid,
            liquidityUsd: market.liquidityUsd,
            collateralPoolUsd: market.collateralPoolUsd,
            volumeTotalUsd: market.volumeTotalUsd,
            volume24hUsd: market.volume24hUsd,
            clientSeq: input.clientSeq,
          });
          const prob = await applyMarketProbability(market.id, tx);
          return { snapshot: snap, probResult: prob, ledgerAmount: "0", replayed: true };
        }
      }

      const [market, actingUser] = await Promise.all([
        tx.market.findUnique({ where: { id: input.marketId } }),
        tx.user.findUnique({ where: { id: input.userId } }),
      ]);

      if (!market) {
        throw new MarketTradeError("NOT_FOUND", "Market not found", 404);
      }
      if (!actingUser || actingUser.isSuspended) {
        throw new MarketTradeError("FORBIDDEN", "User cannot trade", 403);
      }

      assertTradableMarket(market);

      const [userWp, platformWp] = await Promise.all([
        ensureWalletAndPortfolio(tx, input.userId),
        ensureWalletAndPortfolio(tx, platformUserId),
      ]);

      const yesMid = market.yesPrice ?? new Prisma.Decimal("0.5");
      const { execPrice } = computeExecutionPrice({
        side: input.outcome === "YES" ? "YES" : "NO",
        direction: input.direction,
        quantity: input.quantity,
        yesMid,
        liquidityUsd: market.liquidityUsd,
      });

      const notional = execPrice.mul(input.quantity);
      const fee = notional
        .mul(toDec(market.takerFeeBps))
        .div(toDec(BPS_DENOMINATOR));

      if (input.direction === "SELL" && fee.greaterThanOrEqualTo(notional)) {
        throw new MarketTradeError(
          "FEE_EXCEEDS_PROCEEDS",
          "Fee would consume all sale proceeds",
          400,
        );
      }

      const executedAt = new Date();
      let ledgerAmount: Prisma.Decimal;

      if (input.direction === "BUY") {
        const totalDebit = notional.add(fee);
        const bal = await computeWalletBalanceComponents(input.userId, tx);
        if (toDec(bal.availableBalanceUsd).lessThan(totalDebit)) {
          throw new MarketTradeError(
            "INSUFFICIENT_BALANCE",
            "Insufficient available balance",
            400,
          );
        }

        await tx.market.update({
          where: { id: market.id },
          data: {
            collateralPoolUsd: { increment: notional },
            volumeTotalUsd: { increment: notional },
            volume24hUsd: { increment: notional },
            liquidityUsd: { increment: notional },
          },
        });

        await increasePosition(tx, {
          portfolioId: userWp.portfolio.id,
          marketId: market.id,
          side: input.outcome,
          quantity: input.quantity,
          price: execPrice,
        });

        const trade = await tx.trade.create({
          data: {
            marketId: market.id,
            outcome: input.outcome,
            price: execPrice,
            quantity: input.quantity,
            notionalUsd: notional,
            buyerId: input.userId,
            sellerId: platformUserId,
            takerId: input.userId,
            makerId: platformUserId,
            feeBuyerUsd: fee,
            feeSellerUsd: new Prisma.Decimal(0),
            executedAt,
            externalRef: idemRef,
          },
        });

        await tx.platformFee.create({
          data: { tradeId: trade.id, marketId: market.id, amountUsd: fee },
        });

        await creditWallet(tx, platformWp.wallet.id, fee);

        ledgerAmount = totalDebit.negated();
        const balAfterLedger = await reconcileWalletFromLedger(input.userId, tx);
        await recordFinancialEntry(tx, {
          userId: input.userId,
          type: LedgerEntryType.TRADE,
          amount: ledgerAmount,
          portfolioId: userWp.portfolio.id,
          marketId: market.id,
          tradeId: trade.id,
          balanceAfter: toDec(balAfterLedger.availableBalanceUsd),
          metadata: {
            outcome: input.outcome,
            direction: input.direction,
            notional: notional.toFixed(),
            fee: fee.toFixed(),
            leg: "BUY",
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
              price: execPrice.toFixed(),
              quantity: input.quantity.toFixed(),
              tradeId: trade.id,
            },
          },
        });

        const probResult = await applyMarketProbability(market.id, tx);
        const freshMarket = await tx.market.findUniqueOrThrow({
          where: { id: market.id },
        });
        const balAfter = await computeWalletBalanceComponents(input.userId, tx);

        return {
          snapshot: toSnapshot({
            tradeId: trade.id,
            marketId: market.id,
            outcome: input.outcome,
            direction: input.direction,
            price: execPrice,
            quantity: input.quantity,
            notionalUsd: notional,
            feeUsd: fee,
            walletAvailable: toDec(balAfter.availableBalanceUsd),
            yesPrice: freshMarket.yesPrice ?? yesMid,
            noPrice: freshMarket.noPrice ?? clampPrice(D1.minus(yesMid)),
            liquidityUsd: freshMarket.liquidityUsd,
            collateralPoolUsd: freshMarket.collateralPoolUsd,
            volumeTotalUsd: freshMarket.volumeTotalUsd,
            volume24hUsd: freshMarket.volume24hUsd,
            clientSeq: input.clientSeq,
          }),
          probResult,
          ledgerAmount: ledgerAmount.toFixed(),
          replayed: false,
        };
      }

      await decreasePosition(tx, {
        portfolioId: userWp.portfolio.id,
        marketId: market.id,
        side: input.outcome,
        quantity: input.quantity,
      });

      const poolOk = await tx.market.updateMany({
        where: {
          id: market.id,
          collateralPoolUsd: { gte: notional },
        },
        data: {
          collateralPoolUsd: { decrement: notional },
          volumeTotalUsd: { increment: notional },
          volume24hUsd: { increment: notional },
          liquidityUsd: { increment: notional },
        },
      });

      if (poolOk.count !== 1) {
        throw new MarketTradeError(
          "POOL_UNDERFLOW",
          "Collateral pool cannot support this sale",
          400,
        );
      }

      const netCredit = notional.minus(fee);
      const trade = await tx.trade.create({
        data: {
          marketId: market.id,
          outcome: input.outcome,
          price: execPrice,
          quantity: input.quantity,
          notionalUsd: notional,
          buyerId: platformUserId,
          sellerId: input.userId,
          takerId: input.userId,
          makerId: platformUserId,
          feeBuyerUsd: new Prisma.Decimal(0),
          feeSellerUsd: fee,
          executedAt,
          externalRef: idemRef,
        },
      });

      await tx.platformFee.create({
        data: { tradeId: trade.id, marketId: market.id, amountUsd: fee },
      });

      await creditWallet(tx, platformWp.wallet.id, fee);

      ledgerAmount = netCredit;
      const balAfterSell = await reconcileWalletFromLedger(input.userId, tx);
      await recordFinancialEntry(tx, {
        userId: input.userId,
        type: LedgerEntryType.TRADE,
        amount: ledgerAmount,
        portfolioId: userWp.portfolio.id,
        marketId: market.id,
        tradeId: trade.id,
        balanceAfter: toDec(balAfterSell.availableBalanceUsd),
        metadata: {
          outcome: input.outcome,
          direction: input.direction,
          notional: notional.toFixed(),
          fee: fee.toFixed(),
          leg: "SELL",
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
            price: execPrice.toFixed(),
            quantity: input.quantity.toFixed(),
            tradeId: trade.id,
          },
        },
      });

      const probResult = await applyMarketProbability(market.id, tx);
      const freshMarket = await tx.market.findUniqueOrThrow({
        where: { id: market.id },
      });
      const balAfter = await computeWalletBalanceComponents(input.userId, tx);

      return {
        snapshot: toSnapshot({
          tradeId: trade.id,
          marketId: market.id,
          outcome: input.outcome,
          direction: input.direction,
          price: execPrice,
          quantity: input.quantity,
          notionalUsd: notional,
          feeUsd: fee,
          walletAvailable: toDec(balAfter.availableBalanceUsd),
          yesPrice: freshMarket.yesPrice ?? yesMid,
          noPrice: freshMarket.noPrice ?? clampPrice(D1.minus(yesMid)),
          liquidityUsd: freshMarket.liquidityUsd,
          collateralPoolUsd: freshMarket.collateralPoolUsd,
          volumeTotalUsd: freshMarket.volumeTotalUsd,
          volume24hUsd: freshMarket.volume24hUsd,
          clientSeq: input.clientSeq,
        }),
        probResult,
        ledgerAmount: ledgerAmount.toFixed(),
        replayed: false,
      };
    },
    { maxWait: 5_000, timeout: 20_000 },
  );

  return { ...txResult, replayed };
}

export async function executeMarketTrade(
  input: ExecuteMarketTradeInput,
): Promise<TradeExecutionSnapshot> {
  try {
    const locked = await withMarketLock(input.marketId, () =>
      executeMarketTradeInner(input),
    );

    if (locked === null) {
      throw new MarketTradeError(
        "LOCK_CONTENTION",
        "Market busy — retry shortly",
        409,
        2_000,
      );
    }

    const { snapshot, probResult, ledgerAmount, replayed } = locked;

    if (!replayed) {
      await eventBus.emit(SystemEvents.TRADE_CREATED, {
        marketId: snapshot.marketId,
        tradeId: snapshot.tradeId,
        userId: input.userId,
        outcome: snapshot.outcome,
        price: snapshot.executedPrice,
        quantity: snapshot.quantity,
        notionalUsd: snapshot.notionalUsd,
        probability: probResult.probability.toFixed(),
      });

      await eventBus.emit(SystemEvents.PROBABILITY_UPDATED, {
        marketId: snapshot.marketId,
        result: probResult,
      });

      if (ledgerAmount !== "0") {
        await eventBus.emit(SystemEvents.LEDGER_UPDATED, {
          userId: input.userId,
          type: LedgerEntryType.TRADE,
          amount: ledgerAmount,
          txHash: null,
        });
      }
    }

    return snapshot;
  } catch (e) {
    if (e instanceof FraudShieldError) {
      throw new MarketTradeError(e.code, e.message, e.status, e.retryAfterMs);
    }
    throw e;
  }
}
