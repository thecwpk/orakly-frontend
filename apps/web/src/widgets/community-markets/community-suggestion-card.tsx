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
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1",
        isApproved && "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
        isRejected && "bg-rose-500/15 text-rose-300 ring-rose-400/25",
        !isApproved && !isRejected && "bg-zinc-500/15 text-zinc-300 ring-white/10",
      )}
    >
      {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
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
      toast.error("Unable to register your vote. Connect your wallet and try again.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  const submitter = suggestion.creatorAddress
    ? shortenAddress(suggestion.creatorAddress)
    : "Anonymous";

  return (
    <article className="glass-panel-strong rounded-2xl p-4 ring-1 ring-white/[0.06]">
      <p className="text-base font-medium text-zinc-100">{suggestion.question}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 font-medium text-zinc-300 ring-1 ring-white/[0.06]">
          {formatCategory(suggestion.category)}
        </span>
        <span className="font-mono tabular-nums">{submitter}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <span className="text-sm font-semibold tabular-nums text-zinc-300">
          {suggestion.voteCount} {suggestion.voteCount === 1 ? "vote" : "votes"}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={voteMutation.isPending}
            onClick={() => {
              if (!normalizedWallet) {
                toast.message("Connect your wallet to vote");
                return;
              }
              voteMutation.mutate();
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition ring-1",
              hasVoted
                ? "bg-cyan-500/20 text-cyan-100 ring-cyan-400/30"
                : "bg-white/[0.03] text-zinc-200 ring-white/[0.08] hover:bg-white/[0.06]",
            )}
          >
            {hasVoted ? "Voted" : "Vote"}
          </button>
          <StatusBadge status={suggestion.status} />
        </div>
      </div>
    </article>
  );
}
