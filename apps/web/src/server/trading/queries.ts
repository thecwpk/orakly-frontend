import type { OutcomeSide } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@orakly/database";

import {
  getWalletOnChainConfig,
  NATIVE_TOKEN_SENTINEL,
} from "@/server/wallet-onchain";

import { D1, clampPrice, toDec } from "./constants";
import { computeExecutionPrice } from "./pricing";
import type { TradeDirection } from "./trade.service";

export async function getMarketOdds(marketId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      yesPrice: true,
      noPrice: true,
      liquidityUsd: true,
      collateralPoolUsd: true,
      volume24hUsd: true,
      volumeTotalUsd: true,
      takerFeeBps: true,
      closesAt: true,
    },
  });
  return market;
}

export type QuoteParams = {
  marketId: string;
  outcome: OutcomeSide;
  direction: TradeDirection;
  quantity: Prisma.Decimal;
};

export async function quoteExecution(input: QuoteParams) {
  const market = await prisma.market.findUnique({
    where: { id: input.marketId },
    select: {
      id: true,
      status: true,
      yesPrice: true,
      liquidityUsd: true,
      takerFeeBps: true,
      opensAt: true,
      closesAt: true,
    },
  });

  if (!market) {
    return null;
  }

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
    .div(toDec(10_000));
  const newNoMid = clampPrice(D1.minus(newYesMid));

  return {
    marketId: market.id,
    tradableHint: market.status === "OPEN",
    execPrice: execPrice.toFixed(),
    impliedYesAfter: newYesMid.toFixed(),
    impliedNoAfter: newNoMid.toFixed(),
    notionalUsd: notional.toFixed(),
    feeUsd: fee.toFixed(),
    totalDebitUsd:
      input.direction === "BUY" ? notional.add(fee).toFixed() : undefined,
    netCreditUsd:
      input.direction === "SELL" ? notional.minus(fee).toFixed() : undefined,
    takerFeeBps: market.takerFeeBps,
  };
}

function decodeTradeCursor(
  cursor: string | null | undefined,
): { executedAt: Date; id: string } | null {
  if (!cursor?.trim()) return null;
  const hash = cursor.lastIndexOf("#");
  if (hash === -1) return null;
  const iso = cursor.slice(0, hash);
  const id = cursor.slice(hash + 1);
  const executedAt = new Date(iso);
  if (Number.isNaN(executedAt.getTime()) || !id) return null;
  return { executedAt, id };
}

export function encodeTradeCursor(row: { executedAt: Date; id: string }) {
  return `${row.executedAt.toISOString()}#${row.id}`;
}

export async function listUserTrades(input: {
  userId: string;
  take?: number;
  cursor?: string | null;
}) {
  const take = Math.min(input.take ?? 50, 200);
  const decoded = decodeTradeCursor(input.cursor);
  const trades = await prisma.trade.findMany({
    where: {
      OR: [{ buyerId: input.userId }, { sellerId: input.userId }],
      ...(decoded ?
        {
          OR: [
            { executedAt: { lt: decoded.executedAt } },
            {
              AND: [
                { executedAt: decoded.executedAt },
                { id: { lt: decoded.id } },
              ],
            },
          ],
        }
      : {}),
    },
    orderBy: [{ executedAt: "desc" }, { id: "desc" }],
    take: take + 1,
    select: {
      id: true,
      marketId: true,
      outcome: true,
      price: true,
      quantity: true,
      notionalUsd: true,
      buyerId: true,
      sellerId: true,
      feeBuyerUsd: true,
      feeSellerUsd: true,
      executedAt: true,
      externalRef: true,
    },
  });

  let nextCursor: string | null = null;
  const page =
    trades.length > take ?
      (() => {
        const boundary = trades[take - 1]!;
        nextCursor = encodeTradeCursor(boundary);
        return trades.slice(0, take);
      })()
    : trades;

  return {
    trades: page.map((t) => ({
      ...t,
      price: t.price.toFixed(),
      quantity: t.quantity.toFixed(),
      notionalUsd: t.notionalUsd.toFixed(),
      feeBuyerUsd: t.feeBuyerUsd.toFixed(),
      feeSellerUsd: t.feeSellerUsd.toFixed(),
      externalRef: t.externalRef,
      side:
        t.buyerId === input.userId ? ("BUY" as const) : ("SELL" as const),
    })),
    nextCursor,
  };
}

export async function getUserPortfolio(userId: string) {
  const chainCfg = getWalletOnChainConfig();

  const [wallet, portfolio, userMini] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.portfolio.findUnique({
      where: { userId },
      include: {
        positions: {
          include: {
            market: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                yesPrice: true,
                noPrice: true,
                liquidityUsd: true,
                collateralPoolUsd: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    }),
  ]);

  let onChain: {
    chainId: number;
    walletAddress: string;
    syncedAt: string | null;
    balances: Array<{
      tokenAddress: string;
      isNative: boolean;
      symbol: string;
      decimals: number;
      formattedBalance: string;
      rawBalance: string;
    }>;
  } | null = null;

  if (chainCfg && userMini?.walletAddress) {
    const rows = await prisma.walletOnChainBalance.findMany({
      where: { userId, chainId: chainCfg.chainId },
      orderBy: [{ tokenAddress: "asc" }],
    });

    const syncedAt =
      rows.length === 0 ?
        null
      : new Date(
          Math.max(...rows.map((r) => r.syncedAt.getTime())),
        ).toISOString();

    const sentinel = NATIVE_TOKEN_SENTINEL.toLowerCase();

    onChain = {
      chainId: chainCfg.chainId,
      walletAddress: userMini.walletAddress,
      syncedAt,
      balances: rows.map((r) => {
        const isNative = r.tokenAddress.toLowerCase() === sentinel;
        return {
          tokenAddress: r.tokenAddress,
          isNative,
          symbol:
            r.symbol ??
            (isNative ? chainCfg.nativeSymbol : "?"),
          decimals: r.decimals,
          formattedBalance: r.formattedBalance.toFixed(),
          rawBalance: r.rawBalance,
        };
      }),
    };
  }

  return {
    wallet: wallet ?
      {
        availableBalanceUsd: wallet.availableBalance.toFixed(),
        lockedBalanceUsd: wallet.lockedBalance.toFixed(),
      }
    : null,
    positions:
      portfolio?.positions.map((p) => ({
        marketId: p.marketId,
        side: p.side,
        quantity: p.quantity.toFixed(),
        avgEntryPrice: p.avgEntryPrice.toFixed(),
        market: {
          ...p.market,
          yesPrice: p.market.yesPrice?.toFixed() ?? null,
          noPrice: p.market.noPrice?.toFixed() ?? null,
          liquidityUsd: p.market.liquidityUsd.toFixed(),
          collateralPoolUsd: p.market.collateralPoolUsd.toFixed(),
        },
      })) ?? [],
    realizedPnlUsd: portfolio?.realizedPnlUsd.toFixed() ?? "0",
    onChain,
  };
}
