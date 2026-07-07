"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { createCommunitySuggestion } from "@/shared/api/fetchers/community-suggestions";
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
  "w-full rounded-xl border-0 bg-[#08080d] px-3 py-2.5 text-[13px] text-zinc-100",
  "ring-1 ring-white/[0.1] outline-none transition focus:ring-cyan-400/40",
);

export function SubmitMarketModal({ open, onOpenChange, onSuccess }: SubmitMarketModalProps) {
  const { address } = useAccount();
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<string>(SUBMIT_CATEGORIES[0].value);
  const [resolutionSource, setResolutionSource] = useState("");
  const [description, setDescription] = useState("");

  const submitMutation = useMutation({
    mutationFn: () =>
      createCommunitySuggestion({
        question: question.trim(),
        category,
        description: description.trim() || undefined,
        resolutionSource: resolutionSource.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Market idea submitted");
      setQuestion("");
      setCategory(SUBMIT_CATEGORIES[0].value);
      setResolutionSource("");
      setDescription("");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to submit. Connect your wallet and try again.");
    },
  });

  const canSubmit =
    question.trim().length >= 10 && category.length > 0 && !submitMutation.isPending;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "glass-panel-strong rounded-2xl p-6 shadow-xl outline-none ring-1 ring-white/[0.08]",
          )}
        >
          <div className="mb-5 flex items-start justify-between gap-3">
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
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!address) {
                toast.message("Connect your wallet to submit a market idea");
                return;
              }
              if (!canSubmit) return;
              submitMutation.mutate();
            }}
          >
            <label className="block space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
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

            <label className="block space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Category
              </span>
              <select
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
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Resolution source
              </span>
              <input
                type="text"
                value={resolutionSource}
                onChange={(event) => setResolutionSource(event.target.value)}
                placeholder="Official announcement, exchange close, or data provider"
                className={fieldClass}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Description <span className="font-normal normal-case text-zinc-600">(optional)</span>
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="Add context that helps voters evaluate the proposal."
                className={cn(fieldClass, "resize-y")}
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5",
                "text-sm font-semibold transition",
                canSubmit
                  ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/35 hover:bg-cyan-500/30"
                  : "cursor-not-allowed bg-white/[0.04] text-zinc-600 ring-1 ring-white/[0.06]",
              )}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit"
              )}
            </button>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
