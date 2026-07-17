import { prisma } from "@orakly/database";
import {
  LedgerEntryType,
  MarketStatus,
  OutcomeSide,
  Prisma,
} from "@prisma/client";
import { recordFinancialEntry } from "./ledger.service.js";
import {
  computeWalletBalanceComponents,
  reconcileWalletFromLedger,
} from "./walletBalance.service.js";
import { eventBus, SystemEvents } from "./events/eventBus.service.js";
import { withMarketLock } from "./infra/lock.service.js";
import { applyMarketProbability } from "./engines/probabilityEngine.service.js";
import { upsertPositionOnTrade } from "./engines/positionEngine.service.js";
import { assertTradeAllowed, FraudShieldError } from "./security/fraudShield.service.js";

export type NarrativeTradeSide = "FOR" | "AGAINST";

export type ExecuteNarrativeTradeInput = {
  userId: string;
  marketId: string;
  side: NarrativeTradeSide;
  amountUSDT: number;
  idempotencyKey?: string;
};

export type ExecuteNarrativeTradeResult = {
  tradeId: string;
  marketId: string;
  side: NarrativeTradeSide;
  amountUSDT: string;
  probability: string;
  shares: string;
};

function toDec(v: string | number): Prisma.Decimal {
  return new Prisma.Decimal(v);
}

function clampPrice(v: Prisma.Decimal): Prisma.Decimal {
  const min = toDec("0.01");
  const max = toDec("0.99");
  if (v.lessThan(min)) return min;
  if (v.greaterThan(max)) return max;
  return v;
}

export class TradeExecutionError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfterMs?: number;

  constructor(
    code: string,
    message: string,
    status = 400,
    retryAfterMs?: number,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export { FraudShieldError };

async function executeNarrativeTradeInner(
  input: ExecuteNarrativeTradeInput,
): Promise<ExecuteNarrativeTradeResult> {
  if (!Number.isFinite(input.amountUSDT) || input.amountUSDT <= 0) {
    throw new TradeExecutionError("INVALID_AMOUNT", "amountUSDT must be > 0");
  }

  await assertTradeAllowed(input.userId, input.marketId);

  const amount = toDec(input.amountUSDT);
  const outcome: OutcomeSide = input.side === "FOR" ? "YES" : "NO";
  const idemRef = input.idempotencyKey?.trim()
    ? `narrative:${input.userId}:${input.idempotencyKey.trim()}`
    : null;

  if (idemRef) {
    const existing = await prisma.trade.findUnique({
      where: { externalRef: idemRef },
    });
    if (existing) {
      const prob = await applyMarketProbability(existing.marketId);
      return {
        tradeId: existing.id,
        marketId: existing.marketId,
        side: input.side,
        amountUSDT: existing.notionalUsd.toFixed(),
        probability: prob.probability.toFixed(),
        shares: existing.quantity.toFixed(),
      };
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const [market, user, wallet] = await Promise.all([
      tx.market.findUnique({ where: { id: input.marketId } }),
      tx.user.findUnique({ where: { id: input.userId } }),
      tx.wallet.findUnique({ where: { userId: input.userId } }),
    ]);

    if (!market) {
      throw new TradeExecutionError("NOT_FOUND", "Market not found", 404);
    }
    if (market.status !== MarketStatus.OPEN) {
      throw new TradeExecutionError(
        "MARKET_NOT_LIVE",
        "Market is not LIVE (OPEN)",
      );
    }
    if (!user || user.isSuspended) {
      throw new TradeExecutionError("FORBIDDEN", "User cannot trade", 403);
    }
    if (!wallet) {
      throw new TradeExecutionError("NO_WALLET", "User wallet not found", 404);
    }

    const balance = await computeWalletBalanceComponents(input.userId, tx);
    if (toDec(balance.availableBalanceUsd).lessThan(amount)) {
      throw new TradeExecutionError("INSUFFICIENT_FUNDS", "Insufficient USDT balance");
    }

    let portfolio = await tx.portfolio.findUnique({
      where: { userId: input.userId },
    });
    if (!portfolio) {
      portfolio = await tx.portfolio.create({
        data: { userId: input.userId },
      });
    }

    const currentPrice =
      outcome === "YES"
        ? (market.yesPrice ?? toDec("0.5"))
        : (market.noPrice ?? toDec("0.5"));

    const shares = amount.div(currentPrice);

    const platformUser = await tx.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
    });
    if (!platformUser) {
      throw new TradeExecutionError(
        "PLATFORM_USER",
        "Platform liquidity user missing",
        500,
      );
    }

    await upsertPositionOnTrade(tx, {
      portfolioId: portfolio.id,
      marketId: market.id,
      side: outcome,
      quantity: shares,
      price: clampPrice(currentPrice),
    });

    const trade = await tx.trade.create({
      data: {
        marketId: market.id,
        outcome,
        price: clampPrice(currentPrice),
        quantity: shares,
        notionalUsd: amount,
        buyerId: input.userId,
        sellerId: platformUser.id,
        takerId: input.userId,
        makerId: platformUser.id,
        executedAt: new Date(),
        externalRef: idemRef,
      },
    });

    const balAfter = await reconcileWalletFromLedger(input.userId, tx);
    await recordFinancialEntry(tx, {
      userId: input.userId,
      type: LedgerEntryType.TRADE,
      amount: amount.negated(),
      portfolioId: portfolio.id,
      marketId: market.id,
      tradeId: trade.id,
      balanceAfter: toDec(balAfter.availableBalanceUsd),
      metadata: {
        side: input.side,
        amountUSDT: amount.toFixed(),
        leg: "NARRATIVE_BUY",
      },
    });

    await tx.market.update({
      where: { id: market.id },
      data: {
        volumeTotalUsd: { increment: amount },
        volume24hUsd: { increment: amount },
        liquidityUsd: { increment: amount },
        collateralPoolUsd: { increment: amount },
      },
    });

    const probResult = await applyMarketProbability(market.id, tx);

    return {
      tradeId: trade.id,
      marketId: market.id,
      side: input.side,
      amountUSDT: amount.toFixed(),
      probability: probResult.probability.toFixed(),
      shares: shares.toFixed(),
      outcome,
      price: clampPrice(currentPrice).toFixed(),
      quantity: shares.toFixed(),
      notionalUsd: amount.toFixed(),
      probResult,
    };
  });

  await eventBus.emit(SystemEvents.TRADE_CREATED, {
    marketId: result.marketId,
    tradeId: result.tradeId,
    userId: input.userId,
    outcome: result.outcome,
    price: result.price,
    quantity: result.quantity,
    notionalUsd: result.notionalUsd,
    probability: result.probability,
  });

  await eventBus.emit(SystemEvents.PROBABILITY_UPDATED, {
    marketId: result.marketId,
    result: result.probResult,
  });

  await eventBus.emit(SystemEvents.LEDGER_UPDATED, {
    userId: input.userId,
    type: LedgerEntryType.TRADE,
    amount: toDec(result.amountUSDT).negated().toFixed(),
    txHash: null,
  });

  return {
    tradeId: result.tradeId,
    marketId: result.marketId,
    side: result.side,
    amountUSDT: result.amountUSDT,
    probability: result.probability,
    shares: result.shares,
  };
}

export async function executeNarrativeTrade(
  input: ExecuteNarrativeTradeInput,
): Promise<ExecuteNarrativeTradeResult> {
  try {
    const locked = await withMarketLock(input.marketId, () =>
      executeNarrativeTradeInner(input),
    );

    if (locked === null) {
      throw new TradeExecutionError(
        "LOCK_CONTENTION",
        "Market busy. Retry shortly",
        409,
        2_000,
      );
    }

    return locked;
  } catch (e) {
    if (e instanceof FraudShieldError) {
      throw new TradeExecutionError(
        e.code,
        e.message,
        e.status,
        e.retryAfterMs,
      );
    }
    throw e;
  }
}
