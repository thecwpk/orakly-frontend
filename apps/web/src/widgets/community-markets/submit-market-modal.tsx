"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { createCommunitySuggestion } from "@/shared/api/fetchers/community-suggestions";
import { fetchAttentionDashboard } from "@/shared/api/fetchers/attention-dashboard";
import { queryKeys } from "@/shared/api/query-keys";
import { cn } from "@/lib/utils";

export const SUBMIT_CATEGORIES = [
  { label: "Meme", value: "meme" },
  { label: "DeFi", value: "defi" },
  { label: "Layer1", value: "layer1" },
  { label: "Layer2", value: "layer2" },
  { label: "AI", value: "ai" },
  { label: "Other", value: "other" },
] as const;

type SubmitMarketModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const fieldClass = cn(
  "w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-[13px] text-zinc-100",
  "outline-none transition focus:border-blue-500/50",
);

export function SubmitMarketModal({ open, onOpenChange, onSuccess }: SubmitMarketModalProps) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<string>(SUBMIT_CATEGORIES[0].value);
  const [narrative, setNarrative] = useState("");
  const [resolutionSource, setResolutionSource] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const [description, setDescription] = useState("");

  const narrativesQ = useQuery({
    queryKey: queryKeys.hub.attentionDashboard(50),
    queryFn: () => fetchAttentionDashboard(50),
    staleTime: 60_000,
    enabled: open,
  });

  const narrativeOptions = useMemo(() => {
    const items = narrativesQ.data?.data ?? [];
    return [
      ...new Set(
        items
          .map((r) => r.narrativeName?.trim())
          .filter((n): n is string => Boolean(n)),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [narrativesQ.data]);

  const submitMutation = useMutation({
    mutationFn: () =>
      createCommunitySuggestion({
        question: question.trim(),
        category,
        narrative: narrative.trim() || undefined,
        description: description.trim() || undefined,
        resolutionSource: resolutionSource.trim() || undefined,
        resolvesAt: resolutionDate
          ? new Date(resolutionDate).toISOString()
          : undefined,
      }),
    onSuccess: () => {
      toast.success("Market idea submitted.");
      setQuestion("");
      setCategory(SUBMIT_CATEGORIES[0].value);
      setNarrative("");
      setResolutionSource("");
      setResolutionDate("");
      setDescription("");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to submit. Connect your wallet and try again.");
    },
  });

  function validate(): string | null {
    const q = question.trim();
    if (q.length < 10) return "Question must be at least 10 characters.";
    if (!q.endsWith("?")) return "Question must end with a question mark.";
    if (!category) return "Select a category.";
    if (!resolutionDate) return "Select a resolution date.";
    const when = new Date(resolutionDate);
    if (!Number.isFinite(when.getTime())) return "Invalid resolution date.";
    if (when.getTime() < Date.now() + 24 * 60 * 60 * 1000) {
      return "Resolution date must be at least 24 hours from now.";
    }
    if (!isConnected || !address) return "Connect your wallet to submit.";
    return null;
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col",
            "border-l border-white/10 bg-zinc-950 shadow-2xl outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold text-white">
                Submit Market Idea
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm text-zinc-500">
                Propose a question for community review and voting.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              type="button"
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <form
            className="flex flex-1 flex-col overflow-y-auto px-5 py-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isConnected) {
                openConnectModal?.();
                toast.message("Connect your wallet to submit a market idea.");
                return;
              }
              const error = validate();
              if (error) {
                toast.error(error);
                return;
              }
              submitMutation.mutate();
            }}
          >
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Question
                </span>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={3}
                  required
                  minLength={10}
                  maxLength={200}
                  placeholder="Will ETH reach $10,000 by December 31, 2026?"
                  className={cn(fieldClass, "resize-y")}
                />
              </label>

              <div className="space-y-1.5">
                <label
                  htmlFor="submit-market-category"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                >
                  Category
                </label>
                <select
                  id="submit-market-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={fieldClass}
                >
                  {SUBMIT_CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="submit-market-narrative"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                >
                  Narrative{" "}
                  <span className="font-normal normal-case text-zinc-600">(optional)</span>
                </label>
                <select
                  id="submit-market-narrative"
                  value={narrative}
                  onChange={(event) => setNarrative(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Optional</option>
                  {narrativeOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Resolution Source
                </span>
                <input
                  type="text"
                  value={resolutionSource}
                  onChange={(event) => setResolutionSource(event.target.value)}
                  placeholder="Official announcement, exchange close…"
                  className={fieldClass}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Resolution Date
                </span>
                <input
                  type="datetime-local"
                  value={resolutionDate}
                  onChange={(event) => setResolutionDate(event.target.value)}
                  required
                  className={fieldClass}
                />
                <span className="text-[11px] text-zinc-500">Must be at least 24 hours from now</span>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Description{" "}
                  <span className="font-normal normal-case text-zinc-600">(optional)</span>
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="Add context that helps voters evaluate the proposal."
                  className={cn(fieldClass, "resize-y")}
                />
              </label>
            </div>

            <div className="mt-auto border-t border-white/[0.06] pt-4">
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : !isConnected ? (
                  "Connect Wallet"
                ) : (
                  "Submit Market Idea"
                )}
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
