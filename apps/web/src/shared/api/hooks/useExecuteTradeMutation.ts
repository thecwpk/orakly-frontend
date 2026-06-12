"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ExecuteTradeBody,
  TradeExecutionSnapshotDto,
} from "../fetchers/execute-trade";
import { postExecuteTrade } from "../fetchers/execute-trade";
import type { TradesPage } from "../fetchers/trades";
import type { PortfolioSnapshot } from "../fetchers/portfolio";
import type { MarketOddsDto } from "../fetchers/markets-live";
import { marketSubtreeFilter, queryKeys } from "../query-keys";
import { narrativeSideToUiOutcome } from "@/shared/trading/narrative-trade-side";
import {
  injectOptimisticTradePrint,
  stripOptimisticTradePrints,
} from "@/websocket/store/market-realtime-store";

function tempTradeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `optimistic:${crypto.randomUUID()}`;
  }
  return `optimistic:${Date.now()}`;
}

/** Quote snapshot applied instantly while POST /trades is in flight. */
export type TradeOptimisticPreview = {
  execPrice: number;
  impliedYesAfter: number;
  notionalUsd: number;
  feeUsd: number;
  totalDebitUsd: number;
  netCreditUsd: number;
  direction: "BUY" | "SELL";
  outcome: "YES" | "NO";
};

export type ExecuteTradeVariables = ExecuteTradeBody & {
  optimistic?: TradeOptimisticPreview;
};

type MutationCtx = {
  prevTrades: InfiniteData<TradesPage> | undefined;
  prevPortfolio: PortfolioSnapshot | undefined;
  prevOdds: MarketOddsDto | undefined;
};

export function useExecuteTradeMutation(options: {
  userId: string;
  /** Must match `useTradesInfiniteQuery` scope (default session header user). */
  tradesScope?: string;
}) {
  const { userId, tradesScope = "me" } = options;
  const qc = useQueryClient();

  return useMutation<
    TradeExecutionSnapshotDto,
    Error,
    ExecuteTradeVariables,
    MutationCtx
  >({
    mutationFn: async (vars) => {
      const { marketId, side, direction, quantity, clientSeq, idempotencyKey } =
        vars;
      return postExecuteTrade({
        marketId,
        side,
        direction,
        quantity,
        clientSeq,
        idempotencyKey,
      });
    },

    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: queryKeys.trades.infinite(tradesScope) });
      await qc.cancelQueries({ queryKey: queryKeys.portfolio.byUser(userId) });
      await qc.cancelQueries({ queryKey: queryKeys.markets.odds(vars.marketId) });

      const prevTrades = qc.getQueryData<InfiniteData<TradesPage>>(
        queryKeys.trades.infinite(tradesScope),
      );
      const prevPortfolio = qc.getQueryData<PortfolioSnapshot>(
        queryKeys.portfolio.byUser(userId),
      );
      const prevOdds = qc.getQueryData<MarketOddsDto>(
        queryKeys.markets.odds(vars.marketId),
      );

      const opt = vars.optimistic;
      const outcome = narrativeSideToUiOutcome(vars.side);
      const pending: TradesPage["trades"][number] = {
        id: tempTradeId(),
        marketId: vars.marketId,
        outcome,
        price:
          opt ? String(opt.execPrice)
          : "pending",
        quantity: String(vars.quantity),
        notionalUsd:
          opt ? String(opt.notionalUsd)
          : "pending",
        buyerId: userId,
        sellerId: userId,
        feeBuyerUsd: opt ? String(opt.feeUsd) : "0",
        feeSellerUsd: "0",
        executedAt: new Date().toISOString(),
        side: vars.direction,
        optimistic: true,
      };

      const base: InfiniteData<TradesPage> =
        prevTrades?.pages?.length ?
          prevTrades
        : {
            pages: [{ trades: [], nextCursor: null }],
            pageParams: [null],
          };

      qc.setQueryData<InfiniteData<TradesPage>>(
        queryKeys.trades.infinite(tradesScope),
        {
          ...base,
          pages: base.pages.map((p, idx) =>
            idx === 0 ? { ...p, trades: [pending, ...p.trades] } : p,
          ),
        },
      );

      if (opt) {
        const yesStr = opt.impliedYesAfter.toFixed(6);
        const noStr = (1 - opt.impliedYesAfter).toFixed(6);
        qc.setQueryData<MarketOddsDto>(
          queryKeys.markets.odds(vars.marketId),
          (old) => {
            if (!old) {
              return {
                id: vars.marketId,
                title: "",
                slug: "",
                status: "OPEN",
                yesPrice: yesStr,
                noPrice: noStr,
                liquidityUsd: prevOdds?.liquidityUsd ?? "0",
                collateralPoolUsd: prevOdds?.collateralPoolUsd ?? "0",
                volume24hUsd: prevOdds?.volume24hUsd ?? "0",
                volumeTotalUsd: prevOdds?.volumeTotalUsd ?? "0",
                takerFeeBps: prevOdds?.takerFeeBps ?? 25,
                closesAt: prevOdds?.closesAt ?? null,
              };
            }
            return { ...old, yesPrice: yesStr, noPrice: noStr };
          },
        );

        if (prevPortfolio?.wallet) {
          const bal = Number.parseFloat(prevPortfolio.wallet.availableBalanceUsd);
          if (Number.isFinite(bal)) {
            const delta =
              opt.direction === "BUY" ? -opt.totalDebitUsd : opt.netCreditUsd;
            const next = Math.max(0, bal + delta);
            qc.setQueryData<PortfolioSnapshot>(queryKeys.portfolio.byUser(userId), {
              ...prevPortfolio,
              wallet: {
                ...prevPortfolio.wallet,
                availableBalanceUsd: String(next),
              },
            });
          }
        }

        injectOptimisticTradePrint(vars.marketId, {
          side: vars.direction,
          outcome,
          price: String(opt.execPrice),
          quantity: String(vars.quantity),
          notionalUsd: String(opt.notionalUsd),
          at: Date.now(),
        });
      }

      return { prevTrades, prevPortfolio, prevOdds };
    },

    onError: (_err, variables, ctx) => {
      stripOptimisticTradePrints(variables.marketId);
      if (ctx?.prevTrades) {
        qc.setQueryData(queryKeys.trades.infinite(tradesScope), ctx.prevTrades);
      }
      if (ctx?.prevPortfolio !== undefined) {
        qc.setQueryData(queryKeys.portfolio.byUser(userId), ctx.prevPortfolio);
      }
      if (ctx?.prevOdds !== undefined) {
        qc.setQueryData(queryKeys.markets.odds(variables.marketId), ctx.prevOdds);
      } else {
        void qc.invalidateQueries({ queryKey: queryKeys.markets.odds(variables.marketId) });
      }
    },

    onSuccess: (data: TradeExecutionSnapshotDto) => {
      stripOptimisticTradePrints(data.marketId);

      qc.setQueryData(queryKeys.portfolio.byUser(userId), (old: PortfolioSnapshot | undefined) => {
        if (!old?.wallet) return old;
        return {
          ...old,
          wallet: {
            ...old.wallet,
            availableBalanceUsd: data.walletAvailableUsd,
          },
        };
      });

      qc.setQueryData(queryKeys.markets.odds(data.marketId), (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const o = old as Record<string, unknown>;
        return {
          ...o,
          yesPrice: data.odds.yesPrice,
          noPrice: data.odds.noPrice,
          liquidityUsd: data.liquidityUsd,
          collateralPoolUsd: data.collateralPoolUsd,
          volume24hUsd: data.volume24hUsd,
          volumeTotalUsd: data.volumeTotalUsd,
        };
      });
    },

    onSettled: async (_data, _err, variables) => {
      stripOptimisticTradePrints(variables.marketId);
      await qc.invalidateQueries({ queryKey: queryKeys.portfolio.byUser(userId) });
      await qc.invalidateQueries({ queryKey: queryKeys.trades.infinite(tradesScope) });
      await qc.invalidateQueries(marketSubtreeFilter(variables.marketId));
    },
  });
}
