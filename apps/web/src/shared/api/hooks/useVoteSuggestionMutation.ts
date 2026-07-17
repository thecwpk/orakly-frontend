"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { voteMarketSuggestion } from "../fetchers/suggestion-vote";
import { queryKeys } from "../query-keys";

export function useVoteSuggestionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { suggestionId: string; direction: "UP" | "DOWN" }) =>
      voteMarketSuggestion(input.suggestionId, input.direction),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...queryKeys.hub.root(), "suggestions"] });
    },
    onError: () => {
      toast.error("Could not register vote. Sign in with your wallet.");
    },
  });
}
