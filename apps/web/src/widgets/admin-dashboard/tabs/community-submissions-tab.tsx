"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CommunitySuggestion } from "@/shared/contracts/community-suggestion";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { shortAddress } from "@/features/leaderboard/lib/format";
import {
  approveAdminSuggestion,
  fetchAdminConfig,
  fetchAdminSuggestions,
  rejectAdminSuggestion,
} from "../lib/admin-api";
import { Section } from "../components/tab-shell";
import { EmptyState } from "../components/empty-state";
import { adminUi } from "../lib/admin-ui-classes";
import { Dialog as DialogPrimitive } from "radix-ui";

const STATUS_FILTERS = ["Pending", "Approved", "Rejected", "All"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const adminSuggestionsKey = ["admin", "suggestions", "all"] as const;

function isPending(status: string): boolean {
  return status === "pending" || status === "in_review";
}

function filterByStatus(rows: CommunitySuggestion[], filter: StatusFilter): CommunitySuggestion[] {
  if (filter === "All") return rows;
  if (filter === "Pending") return rows.filter((r) => isPending(r.status));
  if (filter === "Approved") return rows.filter((r) => r.status === "approved");
  return rows.filter((r) => r.status === "rejected");
}

function formatSubmitted(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ApproveModal({
  open,
  onOpenChange,
  suggestion,
  defaultReward,
  onApproved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: CommunitySuggestion | null;
  defaultReward: number;
  onApproved: (market: { id: string; slug: string }) => void;
}) {
  const [reward, setReward] = useState(String(defaultReward));

  const mutation = useMutation({
    mutationFn: () =>
      approveAdminSuggestion(suggestion!.id, Number.parseInt(reward, 10) || defaultReward),
    onSuccess: (market) => {
      toast.success("Market created successfully");
      onApproved(market);
      onOpenChange(false);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Approve failed"),
  });

  if (!suggestion) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#03030780]/85 supports-[backdrop-filter]:backdrop-blur-md" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--hub-card)] p-5 ring-1 ring-emerald-400/25">
          <DialogPrimitive.Title className="text-[15px] font-semibold text-[var(--hub-fg)]">
            Approve submission
          </DialogPrimitive.Title>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--hub-fg)]">
            {suggestion.question}
          </p>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[var(--hub-muted)]">
              Creator Reward %
            </span>
            <input
              type="number"
              min={0}
              max={20}
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className={adminUi.input}
            />
          </label>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={adminUi.btnGhost}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-[12px] font-bold text-zinc-950 disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function RejectModal({
  open,
  onOpenChange,
  suggestion,
  onRejected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: CommunitySuggestion | null;
  onRejected: () => void;
}) {
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => rejectAdminSuggestion(suggestion!.id, reason.trim() || undefined),
    onSuccess: () => {
      toast.success("Suggestion rejected");
      onRejected();
      onOpenChange(false);
      setReason("");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Reject failed"),
  });

  if (!suggestion) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#03030780]/85 supports-[backdrop-filter]:backdrop-blur-md" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--hub-card)] p-5 ring-1 ring-rose-400/25">
          <DialogPrimitive.Title className="text-[15px] font-semibold text-[var(--hub-fg)]">
            Reject submission
          </DialogPrimitive.Title>
          <p className="mt-3 line-clamp-3 text-[13px] text-[var(--hub-muted)]">
            {suggestion.question}
          </p>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[var(--hub-muted)]">
              Reason (optional)
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={cn(adminUi.input, "resize-y")}
            />
          </label>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className={adminUi.btnGhost}>
              Cancel
            </button>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 py-2 text-[12px] font-bold text-white disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function AdminCommunitySubmissionsTab({
  canModerate,
}: {
  canModerate: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [query, setQuery] = useState("");
  const [approveTarget, setApproveTarget] = useState<CommunitySuggestion | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CommunitySuggestion | null>(null);
  const [slugByMarketId, setSlugByMarketId] = useState<Record<string, string>>({});

  const qc = useQueryClient();

  const configQ = useQuery({
    queryKey: ["admin", "config", "creator-reward"],
    queryFn: async () => {
      const { configs } = await fetchAdminConfig();
      const raw = configs.creator_default_reward_percent;
      const parsed = Number.parseFloat(raw ?? "5");
      return Number.isFinite(parsed) ? parsed : 5;
    },
    staleTime: 60_000,
  });

  const suggestionsQ = useQuery({
    queryKey: adminSuggestionsKey,
    queryFn: () => fetchAdminSuggestions("all"),
    refetchInterval: 60_000,
    staleTime: 15_000,
  });

  const rows = suggestionsQ.data ?? [];

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 3_600_000;
    let pending = 0;
    let approvedThisWeek = 0;
    let rejected = 0;
    for (const row of rows) {
      if (isPending(row.status)) pending += 1;
      if (row.status === "rejected") rejected += 1;
      if (row.status === "approved") {
        const at = new Date(row.updatedAt).getTime();
        if (Number.isFinite(at) && at >= weekAgo) approvedThisWeek += 1;
      }
    }
    return { pending, approvedThisWeek, rejected };
  }, [rows]);

  const filtered = useMemo(() => {
    const byStatus = filterByStatus(rows, statusFilter);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (r) =>
        r.question.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.creatorAddress?.toLowerCase().includes(q) ?? false),
    );
  }, [rows, statusFilter, query]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminSuggestionsKey });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-lg bg-amber-500/12 px-3 py-1.5 text-[11px] font-bold text-amber-200 ring-1 ring-amber-400/25">
          {stats.pending} pending
        </span>
        <span className="inline-flex items-center rounded-lg bg-emerald-500/12 px-3 py-1.5 text-[11px] font-bold text-emerald-200 ring-1 ring-emerald-400/25">
          {stats.approvedThisWeek} approved this week
        </span>
        <span className="inline-flex items-center rounded-lg bg-rose-500/12 px-3 py-1.5 text-[11px] font-bold text-rose-200 ring-1 ring-rose-400/25">
          {stats.rejected} rejected
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--hub-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search question, category, or submitter…"
            className={cn(adminUi.input, "pl-8 pr-7")}
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)]"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
        <div className={adminUi.segmentWrap}>
          {STATUS_FILTERS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setStatusFilter(label)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider transition",
                statusFilter === label ? adminUi.segmentActive : adminUi.segmentIdle,
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Section title={`${filtered.length} submission${filtered.length === 1 ? "" : "s"}`}>
        <div className="overflow-x-auto">
          {suggestionsQ.isLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={cn(adminUi.skeleton, "h-12 rounded-lg")} />
              ))}
            </div>
          ) : suggestionsQ.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load submissions"
              description={suggestionsQ.error?.message ?? "Try refreshing."}
            />
          ) : filtered.length === 0 ? (
            <EmptyState title="No submissions match" description="Adjust filters or search." />
          ) : (
            <table className="w-full min-w-[960px] border-collapse text-left text-[12.5px]">
              <thead className={adminUi.tableHead}>
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Question</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Submitter</th>
                  <th className="px-3 py-2.5">Votes</th>
                  <th className="px-3 py-2.5">Submitted</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={adminUi.tableRow}>
                {filtered.map((row, index) => {
                  const slug =
                    row.marketSlug ??
                    (row.marketId ? slugByMarketId[row.marketId] : null);
                  return (
                    <tr key={row.id} className="hover:bg-[var(--hub-card-hover)]">
                      <td className="px-3 py-2 font-mono text-[11px] text-[var(--hub-muted)]">
                        {index + 1}
                      </td>
                      <td className="max-w-[260px] px-3 py-2">
                        <p className="line-clamp-2 font-medium text-[var(--hub-fg)]">
                          {row.question}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-[var(--hub-muted)]">{row.category}</td>
                      <td className="px-3 py-2 font-mono text-[11px]">
                        {row.creatorAddress ? shortAddress(row.creatorAddress) : "N/A"}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums">{row.voteCount}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-[var(--hub-muted)]">
                        {formatSubmitted(row.createdAt)}
                      </td>
                      <td className="px-3 py-2 capitalize">{row.status.replace("_", " ")}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {isPending(row.status) && canModerate ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setApproveTarget(row)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-emerald-200 ring-1 ring-emerald-400/25 hover:bg-emerald-500/25"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(row)}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-rose-200 ring-1 ring-rose-400/25 hover:bg-rose-500/25"
                              >
                                Reject
                              </button>
                            </>
                          ) : row.status === "approved" ? (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 ring-1 ring-emerald-400/25">
                                <CheckCircle2 className="h-3 w-3" />
                                Approved
                              </span>
                              {slug ? (
                                <Link
                                  href={ROUTES.market(slug)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10.5px] text-cyan-300 hover:underline"
                                >
                                  View market
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              ) : null}
                            </div>
                          ) : row.status === "rejected" ? (
                            <span
                              title={row.rejectionReason ?? undefined}
                              className="inline-flex cursor-help items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-200 ring-1 ring-rose-400/25"
                            >
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      <ApproveModal
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        suggestion={approveTarget}
        defaultReward={configQ.data ?? 5}
        onApproved={(market) => {
          setSlugByMarketId((prev) => ({ ...prev, [market.id]: market.slug }));
          invalidate();
        }}
      />

      <RejectModal
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        suggestion={rejectTarget}
        onRejected={invalidate}
      />
    </div>
  );
}

/** Pending count for tab badge — exported for parent page. */
export function useAdminPendingSubmissionsCount() {
  const q = useQuery({
    queryKey: adminSuggestionsKey,
    queryFn: () => fetchAdminSuggestions("all"),
    refetchInterval: 60_000,
    staleTime: 15_000,
  });
  return useMemo(
    () => (q.data ?? []).filter((r) => isPending(r.status)).length,
    [q.data],
  );
}

export { adminSuggestionsKey };
