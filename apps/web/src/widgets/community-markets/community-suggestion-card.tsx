"use client";

import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommunitySuggestion } from "@/shared/contracts/community-suggestion";
import { voteCommunitySuggestion } from "@/shared/api/fetchers/community-suggestions";
import { queryKeys } from "@/shared/api/query-keys";
import { cn } from "@/lib/utils";

function shortenAddress(address: string): string {
  const normalized = address.trim();
  if (normalized.length < 10) return normalized;
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}

function formatCategory(category: string): string {
  if (!category) return "General";
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isApproved = normalized === "approved";
  const isRejected = normalized === "rejected";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        isApproved && "bg-emerald-100 text-emerald-700",
        isRejected && "bg-red-100 text-red-700",
        !isApproved && !isRejected && "bg-gray-100 text-gray-600",
      )}
    >
      {isApproved ? "approved" : isRejected ? "rejected" : "pending"}
    </span>
  );
}

type CommunitySuggestionCardProps = {
  suggestion: CommunitySuggestion;
  walletAddress: string | null;
  queryKey: ReturnType<typeof queryKeys.markets.communitySuggestions>;
};

export function CommunitySuggestionCard({
  suggestion,
  walletAddress,
  queryKey,
}: CommunitySuggestionCardProps) {
  const qc = useQueryClient();
  const normalizedWallet = walletAddress?.toLowerCase() ?? null;
  const hasVoted =
    normalizedWallet != null &&
    suggestion.voterAddresses.some((addr) => addr.toLowerCase() === normalizedWallet);

  const voteMutation = useMutation({
    mutationFn: () => voteCommunitySuggestion(suggestion.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<CommunitySuggestion[]>(queryKey);

      qc.setQueryData<CommunitySuggestion[]>(queryKey, (current) =>
        (current ?? []).map((item) => {
          if (item.id !== suggestion.id || !normalizedWallet) return item;

          const voted = item.voterAddresses.some(
            (addr) => addr.toLowerCase() === normalizedWallet,
          );

          if (voted) {
            return {
              ...item,
              voteCount: Math.max(0, item.voteCount - 1),
              voterAddresses: item.voterAddresses.filter(
                (addr) => addr.toLowerCase() !== normalizedWallet,
              ),
            };
          }

          return {
            ...item,
            voteCount: item.voteCount + 1,
            voterAddresses: [...item.voterAddresses, normalizedWallet],
          };
        }),
      );

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKey, context.previous);
      }
      toast.error("Could not register vote. Sign in with your wallet.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  const submitter = suggestion.creatorAddress
    ? shortenAddress(suggestion.creatorAddress)
    : "Anonymous";

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-base font-medium text-gray-900">{suggestion.question}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700">
          {formatCategory(suggestion.category)}
        </span>
        <span className="font-mono tabular-nums">{submitter}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <span className="text-sm font-semibold tabular-nums text-gray-700">
          {suggestion.voteCount} {suggestion.voteCount === 1 ? "vote" : "votes"}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={voteMutation.isPending}
            onClick={() => {
              if (!normalizedWallet) {
                toast.message("Connect wallet to vote");
                return;
              }
              voteMutation.mutate();
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
              hasVoted
                ? "bg-gray-900 text-white"
                : "border border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50",
            )}
          >
            {hasVoted ? "Voted ✓" : "Vote ↑"}
          </button>
          <StatusBadge status={suggestion.status} />
        </div>
      </div>
    </article>
  );
}
