"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Market } from "@orakly/types";
import type { CreateMarketPayload } from "@/api/schemas/create-market";
import { QueryApiError } from "@/shared/api/unwrap";
import { invalidateMarketsFeed } from "@/shared/api/invalidate";
import { queryKeys } from "@/shared/api/query-keys";
import { createMarketRequest } from "../api/create-market";

/**
 * Optimistic publish: immediately prepends the new market into the
 * `markets.feed()` cache so the user sees it appear in the hub on success.
 * Server is mocked to return a 200 with the canonical Market shape; on error
 * the optimistic insert is rolled back via `onError`.
 */
export function useCreateMarketMutation() {
  const qc = useQueryClient();

  return useMutation<Market, Error, CreateMarketPayload>({
    mutationKey: ["create-market"],
    mutationFn: async (payload) => {
      const res = await createMarketRequest(payload);
      if (!res.ok) {
        throw new QueryApiError(res.error.code, res.error.message);
      }
      return res.data;
    },

    onMutate: async (payload) => {
      const feedKey = queryKeys.markets.feed();
      await qc.cancelQueries({ queryKey: feedKey });
      const prev = qc.getQueryData<Market[]>(feedKey);

      const optimistic: Market = {
        id: `optimistic-${payload.slug}`,
        slug: payload.slug,
        title: payload.title,
        category: payload.category,
        volumeUsd: 0,
        liquidityUsd: payload.liquiditySeedUsd,
        probability: payload.initialProbability,
        closesAt: payload.closesAt,
        status: "OPEN",
      };

      qc.setQueryData<Market[]>(feedKey, (current = []) => [
        optimistic,
        ...current,
      ]);

      return { prev, optimisticId: optimistic.id };
    },

    onError: (_err, _vars, ctx) => {
      const feedKey = queryKeys.markets.feed();
      const previous =
        (ctx as { prev?: Market[] } | undefined)?.prev ?? undefined;
      if (previous) {
        qc.setQueryData(feedKey, previous);
      } else {
        void qc.invalidateQueries({ queryKey: feedKey });
      }
    },

    onSuccess: (created, _vars, ctx) => {
      const feedKey = queryKeys.markets.feed();
      const optimisticId = (
        ctx as { optimisticId?: string } | undefined
      )?.optimisticId;
      qc.setQueryData<Market[]>(feedKey, (current = []) => {
        const without = optimisticId
          ? current.filter((m) => m.id !== optimisticId)
          : current;
        return [created, ...without.filter((m) => m.id !== created.id)];
      });
      invalidateMarketsFeed(qc);
    },
  });
}
