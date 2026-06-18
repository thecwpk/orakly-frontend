"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatChainTradeError } from "../lib/format-trade-error";
import { bumpPortfolioGeneration } from "@/websocket/store/portfolio-generation-store";
import { queryKeys, marketSubtreeFilter } from "@/shared/api/query-keys";
import type { TradesPage } from "@/shared/api/fetchers/trades";
import type { PortfolioSnapshot } from "@/shared/api/fetchers/portfolio";
import {
  useChainTradeBuy,
  type ChainTradeBuyArgs,
} from "./use-chain-trade";

function tempTradeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `chain-opt:${crypto.randomUUID()}`;
  }
  return `chain-opt:${Date.now()}`;
}

export type OptimisticChainTradeBody = ChainTradeBuyArgs & {
  /** UUID market key used by REST / optimistic trade rows */
  appMarketId: string;
};

/**
 * Optimistic trade rows + cache rollback, mirroring `useExecuteTradeMutation`,
 * then settles against chain receipt and **coalesces with realtime** via
 * `invalidateQueries` + `bumpPortfolioGeneration` (WS payloads still win when present).
 */
export function useOptimisticChainTradeMutation(options: {
  userId: string;
  tradesScope?: string;
}) {
  const { userId, tradesScope = "me" } = options;
  const qc = useQueryClient();
  const chainBuy = useChainTradeBuy();

  return useMutation({
    mutationKey: ["chain-trade", "optimistic", userId, tradesScope],
    mutationFn: async (body: OptimisticChainTradeBody) => {
      const buy: ChainTradeBuyArgs = {
        marketAddress: body.marketAddress,
        outcome: body.outcome,
        collateralWei: body.collateralWei,
        minOutWei: body.minOutWei,
      };
      await toast.promise(chainBuy.mutateAsync(buy), {
        loading: `Submitting ${body.outcome} on-chain…`,
        success: `${body.outcome} trade confirmed on-chain`,
        error: (e) => formatChainTradeError(e),
      });
    },

    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: queryKeys.trades.infinite(tradesScope) });
      await qc.cancelQueries({ queryKey: queryKeys.portfolio.byUser(userId) });

      const prevTrades = qc.getQueryData<InfiniteData<TradesPage>>(
        queryKeys.trades.infinite(tradesScope),
      );
      const prevPortfolio = qc.getQueryData<PortfolioSnapshot>(
        queryKeys.portfolio.byUser(userId),
      );

      if (prevTrades?.pages?.length) {
        const pending: TradesPage["trades"][number] = {
          id: tempTradeId(),
          marketId: body.appMarketId,
          outcome: body.outcome,
          price: "pending",
          quantity: body.collateralWei.toString(),
          notionalUsd: "pending",
          buyerId: userId,
          sellerId: userId,
          feeBuyerUsd: "0",
          feeSellerUsd: "0",
          executedAt: new Date().toISOString(),
          side: "BUY",
          optimistic: true,
        };

        qc.setQueryData<InfiniteData<TradesPage>>(
          queryKeys.trades.infinite(tradesScope),
          {
            ...prevTrades,
            pages: prevTrades.pages.map((p, idx) =>
              idx === 0 ? { ...p, trades: [pending, ...p.trades] } : p,
            ),
          },
        );
      }

      return { prevTrades, prevPortfolio };
    },

    onError: (_err, _body, ctx) => {
      if (ctx?.prevTrades) {
        qc.setQueryData(queryKeys.trades.infinite(tradesScope), ctx.prevTrades);
      }
      if (ctx?.prevPortfolio !== undefined) {
        qc.setQueryData(queryKeys.portfolio.byUser(userId), ctx.prevPortfolio);
      }
    },

    onSettled: async (_data, _err, variables) => {
      bumpPortfolioGeneration(userId);
      await qc.invalidateQueries({ queryKey: queryKeys.portfolio.byUser(userId) });
      await qc.invalidateQueries({ queryKey: queryKeys.trades.infinite(tradesScope) });
      await qc.invalidateQueries(marketSubtreeFilter(variables.appMarketId));
    },
  });
}
