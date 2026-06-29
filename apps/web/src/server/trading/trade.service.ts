import {
  ActivityType,
  MarketStatus,
  type OutcomeSide,
  Prisma,
  TransactionType,
} from "@prisma/client";
import { prisma } from "@orakly/database";
import { BPS_DENOMINATOR, D1, clampPrice, toDec } from "./constants";
import { TradingError } from "./errors";
import { computeExecutionPrice } from "./pricing";
import { increasePosition, decreasePosition } from "./positions";
import { ensurePlatformLiquidityUserId } from "./platform-user";
import { ensureWalletAndPortfolio } from "./user-setup";
import {
  creditAvailableBalance,
  debitAvailableBalance,
} from "./wallet-ledger";
import { publishTradeRealtime } from "../realtime/notify";

const MIN_QTY = toDec("0.00000001");
const MAX_QTY = toDec("1000000000");

export type TradeDirection = "BUY" | "SELL";

export type ExecuteMarketTradeInput = {
  userId: string;
  marketId: string;
  outcome: OutcomeSide;
  direction: TradeDirection;
  quantity: Prisma.Decimal;
  /** Returned verbatim for optimistic UI merges. */
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

function externalRefFor(userId: string, key: string): string {
  return `trade:${userId}:${key}`;
}

function assertTradableMarket(m: {
  status: MarketStatus;
  opensAt: Date | null;
  closesAt: Date | null;
}) {
  if (m.status !== MarketStatus.OPEN) {
    throw new TradingError("MARKET_CLOSED", "Market is not open for trading", 400);
  }
  const now = new Date();
  if (m.opensAt && now < m.opensAt) {
    throw new TradingError("MARKET_NOT_OPEN", "Market has not opened yet", 400);
  }
  if (m.closesAt && now > m.closesAt) {
    throw new TradingError("MARKET_CLOSED", "Market trading window has ended", 400);
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
    ...(input.clientSeq !== undefined ? { clientSeq: input.clientSeq } : {}),
  };
}

export async function executeMarketTrade(
  input: ExecuteMarketTradeInput,
): Promise<TradeExecutionSnapshot> {
  if (input.quantity.lessThan(MIN_QTY) || input.quantity.greaterThan(MAX_QTY)) {
    throw new TradingError("INVALID_QUANTITY", "Quantity out of allowed bounds", 400);
  }

  const platformUserId = await ensurePlatformLiquidityUserId();
  if (input.userId === platformUserId) {
    throw new TradingError(
      "INVALID_ACTOR",
      "Platform liquidity account cannot trade as a user",
      400,
    );
  }

  const idemRef =
    input.idempotencyKey?.trim() ?
      externalRefFor(input.userId, input.idempotencyKey.trim())
    : null;

  let replayed = false;

  try {
    const snapshot = await prisma.$transaction(
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
            const wallet = await tx.wallet.findUniqueOrThrow({
              where: { userId: input.userId },
            });
            const yesMid =
              market.yesPrice ?? new Prisma.Decimal("0.5");
            const noMid =
              market.noPrice ?? clampPrice(D1.minus(yesMid));
            return toSnapshot({
              tradeId: existing.id,
              marketId: existing.marketId,
              outcome: existing.outcome,
              direction:
                existing.buyerId === input.userId ? "BUY" : "SELL",
              price: existing.price,
              quantity: existing.quantity,
              notionalUsd: existing.notionalUsd,
              feeUsd: existing.feeBuyerUsd.plus(existing.feeSellerUsd),
              walletAvailable: wallet.availableBalance,
              yesPrice: yesMid,
              noPrice: noMid,
              liquidityUsd: market.liquidityUsd,
              collateralPoolUsd: market.collateralPoolUsd,
              volumeTotalUsd: market.volumeTotalUsd,
              volume24hUsd: market.volume24hUsd,
              clientSeq: input.clientSeq,
            });
          }
        }

        const [market, actingUser] = await Promise.all([
          tx.market.findUnique({ where: { id: input.marketId } }),
          tx.user.findUnique({ where: { id: input.userId } }),
        ]);

        if (!market) {
          throw new TradingError("NOT_FOUND", "Market not found", 404);
        }
        if (!actingUser || actingUser.isSuspended) {
          throw new TradingError("FORBIDDEN", "User cannot trade", 403);
        }

        assertTradableMarket(market);

        if (market.takerFeeBps < 0 || market.takerFeeBps > 5_000) {
          throw new TradingError(
            "MARKET_CONFIG",
            "Market fee configuration is invalid",
            500,
          );
        }

        const [userWp, platformWp] = await Promise.all([
          ensureWalletAndPortfolio(tx, input.userId),
          ensureWalletAndPortfolio(tx, platformUserId),
        ]);

        const yesMid = market.yesPrice ?? new Prisma.Decimal("0.5");
        const { execPrice, newYesMid } = computeExecutionPrice({
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
          throw new TradingError(
            "FEE_EXCEEDS_PROCEEDS",
            "Fee would consume all sale proceeds",
            400,
          );
        }

        const executedAt = new Date();
        const newNoMid = clampPrice(D1.minus(newYesMid));

        if (input.direction === "BUY") {
          const buyerId = input.userId;
          const sellerId = platformUserId;
          const feeBuyerUsd = fee;
          const feeSellerUsd = new Prisma.Decimal(0);
          const totalDebit = notional.add(fee);
          const userBalAfterDebit = await debitAvailableBalance(
            tx,
            userWp.wallet.id,
            totalDebit,
          );
          const platBalAfterFee = await creditAvailableBalance(
            tx,
            platformWp.wallet.id,
            fee,
          );

          await tx.market.update({
            where: { id: market.id },
            data: {
              collateralPoolUsd: { increment: notional },
              yesPrice: newYesMid,
              noPrice: newNoMid,
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
              buyerId,
              sellerId,
              takerId: input.userId,
              makerId: platformUserId,
              feeBuyerUsd,
              feeSellerUsd,
              executedAt,
              externalRef: idemRef,
            },
          });

          await tx.platformFee.create({
            data: {
              tradeId: trade.id,
              marketId: market.id,
              amountUsd: fee,
            },
          });

          await tx.transaction.create({
            data: {
              userId: input.userId,
              portfolioId: userWp.portfolio.id,
              marketId: market.id,
              tradeId: trade.id,
              type: TransactionType.TRADE_BUY,
              amountUsd: totalDebit.negated(),
              balanceAfter: userBalAfterDebit,
              metadata: {
                outcome: input.outcome,
                direction: input.direction,
                notional: notional.toFixed(),
                fee: fee.toFixed(),
              },
            },
          });

          await tx.transaction.create({
            data: {
              userId: platformUserId,
              marketId: market.id,
              tradeId: trade.id,
              type: TransactionType.FEE_PLATFORM,
              amountUsd: fee,
              balanceAfter: platBalAfterFee,
              metadata: { source: "taker_fee", marketId: market.id },
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

          const freshMarket = await tx.market.findUniqueOrThrow({
            where: { id: market.id },
          });
          const freshWallet = await tx.wallet.findUniqueOrThrow({
            where: { userId: input.userId },
          });

          return toSnapshot({
            tradeId: trade.id,
            marketId: market.id,
            outcome: input.outcome,
            direction: input.direction,
            price: execPrice,
            quantity: input.quantity,
            notionalUsd: notional,
            feeUsd: fee,
            walletAvailable: freshWallet.availableBalance,
            yesPrice: freshMarket.yesPrice ?? newYesMid,
            noPrice: freshMarket.noPrice ?? newNoMid,
            liquidityUsd: freshMarket.liquidityUsd,
            collateralPoolUsd: freshMarket.collateralPoolUsd,
            volumeTotalUsd: freshMarket.volumeTotalUsd,
            volume24hUsd: freshMarket.volume24hUsd,
            clientSeq: input.clientSeq,
          });
        } else {
          const buyerId = platformUserId;
          const sellerId = input.userId;
          const feeBuyerUsd = new Prisma.Decimal(0);
          const feeSellerUsd = fee;

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
              yesPrice: newYesMid,
              noPrice: newNoMid,
              volumeTotalUsd: { increment: notional },
              volume24hUsd: { increment: notional },
              liquidityUsd: { increment: notional },
            },
          });

          if (poolOk.count !== 1) {
            throw new TradingError(
              "POOL_UNDERFLOW",
              "Collateral pool cannot support this sale",
              400,
            );
          }

          const netCredit = notional.minus(fee);
          const userBal = await creditAvailableBalance(
            tx,
            userWp.wallet.id,
            netCredit,
          );
          const platBal = await creditAvailableBalance(
            tx,
            platformWp.wallet.id,
            fee,
          );

          const trade = await tx.trade.create({
            data: {
              marketId: market.id,
              outcome: input.outcome,
              price: execPrice,
              quantity: input.quantity,
              notionalUsd: notional,
              buyerId,
              sellerId,
              takerId: input.userId,
              makerId: platformUserId,
              feeBuyerUsd,
              feeSellerUsd,
              executedAt,
              externalRef: idemRef,
            },
          });

          await tx.platformFee.create({
            data: {
              tradeId: trade.id,
              marketId: market.id,
              amountUsd: fee,
            },
          });

          await tx.transaction.create({
            data: {
              userId: input.userId,
              portfolioId: userWp.portfolio.id,
              marketId: market.id,
              tradeId: trade.id,
              type: TransactionType.TRADE_SELL,
              amountUsd: netCredit,
              balanceAfter: userBal,
              metadata: {
                outcome: input.outcome,
                direction: input.direction,
                notional: notional.toFixed(),
                fee: fee.toFixed(),
              },
            },
          });

          await tx.transaction.create({
            data: {
              userId: platformUserId,
              marketId: market.id,
              tradeId: trade.id,
              type: TransactionType.FEE_PLATFORM,
              amountUsd: fee,
              balanceAfter: platBal,
              metadata: { source: "taker_fee", marketId: market.id },
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

          const freshMarket = await tx.market.findUniqueOrThrow({
            where: { id: market.id },
          });
          const freshWallet = await tx.wallet.findUniqueOrThrow({
            where: { userId: input.userId },
          });

          return toSnapshot({
            tradeId: trade.id,
            marketId: market.id,
            outcome: input.outcome,
            direction: input.direction,
            price: execPrice,
            quantity: input.quantity,
            notionalUsd: notional,
            feeUsd: fee,
            walletAvailable: freshWallet.availableBalance,
            yesPrice: freshMarket.yesPrice ?? newYesMid,
            noPrice: freshMarket.noPrice ?? newNoMid,
            liquidityUsd: freshMarket.liquidityUsd,
            collateralPoolUsd: freshMarket.collateralPoolUsd,
            volumeTotalUsd: freshMarket.volumeTotalUsd,
            volume24hUsd: freshMarket.volume24hUsd,
            clientSeq: input.clientSeq,
          });
        }
      },
      {
        maxWait: 5_000,
        timeout: 20_000,
      },
    );

    if (!replayed) {
      publishTradeRealtime(snapshot, input.userId);
    }

    return snapshot;
  } catch (e) {
    if (e instanceof TradingError) {
      throw e;
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      if (idemRef) {
        const existing = await prisma.trade.findUnique({
          where: { externalRef: idemRef },
        });
        if (existing) {
          replayed = true;
          const market = await prisma.market.findUniqueOrThrow({
            where: { id: existing.marketId },
          });
          const wallet = await prisma.wallet.findUniqueOrThrow({
            where: { userId: input.userId },
          });
          const yesMid = market.yesPrice ?? new Prisma.Decimal("0.5");
          const noMid = market.noPrice ?? clampPrice(D1.minus(yesMid));
          return toSnapshot({
            tradeId: existing.id,
            marketId: existing.marketId,
            outcome: existing.outcome,
            direction: existing.buyerId === input.userId ? "BUY" : "SELL",
            price: existing.price,
            quantity: existing.quantity,
            notionalUsd: existing.notionalUsd,
            feeUsd: existing.feeBuyerUsd.plus(existing.feeSellerUsd),
            walletAvailable: wallet.availableBalance,
            yesPrice: yesMid,
            noPrice: noMid,
            liquidityUsd: market.liquidityUsd,
            collateralPoolUsd: market.collateralPoolUsd,
            volumeTotalUsd: market.volumeTotalUsd,
            volume24hUsd: market.volume24hUsd,
            clientSeq: input.clientSeq,
          });
        }
      }
    }
    throw e;
  }
}
