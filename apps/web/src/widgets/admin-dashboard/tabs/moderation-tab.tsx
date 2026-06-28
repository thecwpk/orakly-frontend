"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  Flame,
  Pause,
  Play,
  ShieldCheck,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api";
import {
  adminMarketsKey,
  adminOverviewKey,
  useAdminMarketsQuery,
  type AdminMarketRow,
} from "../hooks/use-admin-queries";
import { Section, TabShell } from "../components/tab-shell";
import { StatusPill } from "../components/status-pill";
import { ConfirmDialog } from "../components/confirm-dialog";
import { EmptyState } from "../components/empty-state";
import { shortId } from "../lib/format";

type FilterMode = "all" | "draft" | "paused";

type ModerateTarget = { id: string; title: string; status: string } | null;

export function AdminModerationTab({ canModerate }: { canModerate: boolean }) {
  const [mode, setMode] = useState<FilterMode>("all");
  const [target, setTarget] = useState<ModerateTarget>(null);

  // Server only filters one status at a time, so we fetch once and split client-side.
  const draftQ = useAdminMarketsQuery("DRAFT", true, 60);
  const pausedQ = useAdminMarketsQuery("PAUSED", true, 60);

  const qc = useQueryClient();

  const moderate = useMutation({
    mutationFn: async (vars: { id: string; status: string }) =>
      adminApi(`/markets/${vars.id}`, {
        method: "PATCH",
        json: { status: vars.status },
      }),
    onSuccess: () => {
      toast.success("Market moderated");
      void qc.invalidateQueries({ queryKey: ["admin", "markets"] });
      void qc.invalidateQueries({ queryKey: adminOverviewKey });
      setTarget(null);
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Moderation failed"),
  });

  const drafts = useMemo(() => draftQ.data ?? [], [draftQ.data]);
  const paused = useMemo(() => pausedQ.data ?? [], [pausedQ.data]);
  const isLoading = draftQ.isLoading || pausedQ.isLoading;
  const isError = draftQ.isError || pausedQ.isError;

  const queue = useMemo(() => {
    if (mode === "draft") return drafts;
    if (mode === "paused") return paused;
    // Paused first (warmer urgency), then drafts.
    return [...paused, ...drafts];
  }, [mode, drafts, paused]);

  const refresh = () => {
    void draftQ.refetch();
    void pausedQ.refetch();
    void qc.invalidateQueries({ queryKey: adminMarketsKey("DRAFT", 60) });
    void qc.invalidateQueries({ queryKey: adminMarketsKey("PAUSED", 60) });
  };

  return (
    <TabShell
      eyebrow="Queue"
      title="Moderation"
      description="Drafts awaiting publication and paused markets requiring intervention. Acting from this queue is logged for compliance."
      actions={
        <button
          type="button"
          onClick={refresh}
          disabled={draftQ.isFetching || pausedQ.isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--hub-bg-subtle)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] disabled:opacity-50"
        >
          <Eye className="h-3.5 w-3.5" />
          Refresh queue
        </button>
      }
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <ModeChip
          active={mode === "all"}
          tone="violet"
          onClick={() => setMode("all")}
          label="All"
          count={drafts.length + paused.length}
          hint="Drafts + paused"
          icon={ShieldCheck}
        />
        <ModeChip
          active={mode === "paused"}
          tone="rose"
          onClick={() => setMode("paused")}
          label="Paused"
          count={paused.length}
          hint="Trading suspended"
          icon={Flame}
        />
        <ModeChip
          active={mode === "draft"}
          tone="amber"
          onClick={() => setMode("draft")}
          label="Drafts"
          count={drafts.length}
          hint="Awaiting publish"
          icon={AlertTriangle}
        />
      </div>

      <Section
        title={`${queue.length} item${queue.length === 1 ? "" : "s"} in queue`}
        description={
          mode === "paused"
            ? "Resume trading or close out."
            : mode === "draft"
              ? "Review draft, then publish (OPEN)."
              : "Highest urgency first."
        }
      >
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer h-16 rounded-lg ring-1 ring-[var(--hub-border)]"
              />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load moderation queue"
            description="Try refreshing."
          />
        ) : queue.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Queue clear"
            description="Nothing requires moderation right now."
          />
        ) : (
          <ul className="divide-y divide-[var(--hub-border)]">
            <AnimatePresence initial={false}>
              {queue.map((m) => (
                <ModerationCard
                  key={m.id}
                  market={m}
                  canModerate={canModerate}
                  onAct={(status) =>
                    setTarget({ id: m.id, title: m.title, status })
                  }
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Section>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => (!o ? setTarget(null) : null)}
        tone={target?.status === "CLOSED" ? "danger" : "warning"}
        title={`Moderate “${target?.title ?? ""}”`}
        description={
          <span>
            New status:{" "}
            <span className="font-semibold text-white">{target?.status}</span>.
            {target?.status === "OPEN"
              ? " Trading begins immediately and the market goes live in discovery feeds."
              : null}
            {target?.status === "PAUSED"
              ? " Open orders stay on book; new fills are blocked."
              : null}
            {target?.status === "CLOSED"
              ? " Trading is permanently disabled. Pair with resolution."
              : null}
          </span>
        }
        confirmLabel={`Apply ${target?.status}`}
        busy={moderate.isPending}
        onConfirm={() => {
          if (!target) return;
          moderate.mutate({ id: target.id, status: target.status });
        }}
      />
    </TabShell>
  );
}

function ModeChip({
  active,
  tone,
  onClick,
  label,
  count,
  hint,
  icon: Icon,
}: {
  active: boolean;
  tone: "violet" | "rose" | "amber";
  onClick: () => void;
  label: string;
  count: number;
  hint: string;
  icon: typeof Flame;
}) {
  const T = {
    violet: "ring-[var(--hub-border-strong)] bg-violet-500/10 text-[var(--hub-primary-bright)]",
    rose: "ring-rose-400/30 bg-rose-500/10 text-rose-200",
    amber: "ring-amber-400/30 bg-amber-500/10 text-amber-200",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2.5 overflow-hidden rounded-2xl bg-[var(--hub-bg-subtle)] px-4 py-3 text-left ring-1 transition hover:bg-[var(--hub-bg-subtle)]",
        active ? T[tone] : "ring-[var(--hub-border)]",
      )}
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md ring-1",
          active ? T[tone] : "bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-[var(--hub-border)]",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
          {hint}
        </span>
        <span className="block text-[13.5px] font-semibold text-white">{label}</span>
      </span>
      <span className="font-mono text-[16px] font-semibold tabular-nums text-white">
        {count}
      </span>
      {active ? (
        <motion.span
          layoutId="moderation-mode-active"
          aria-hidden
          className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[var(--hub-primary-bright)]"
        />
      ) : null}
    </button>
  );
}

function ModerationCard({
  market,
  canModerate,
  onAct,
}: {
  market: AdminMarketRow;
  canModerate: boolean;
  onAct: (status: string) => void;
}) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-wrap items-center gap-3 px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusPill status={market.status} />
          {market.category ? (
            <span className="rounded-md bg-[var(--hub-bg-subtle)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)]">
              {market.category.name}
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] font-medium text-[var(--hub-fg)]">
          {market.title}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Link
            href={`/markets/${market.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 truncate font-mono text-[10.5px] text-[var(--hub-muted)] hover:text-[var(--hub-primary-bright)]"
          >
            {market.slug}
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
          <span className="text-[var(--hub-border)]">·</span>
          <span className="font-mono text-[10px] text-[var(--hub-muted)]">
            {shortId(market.id)}
          </span>
        </div>
      </div>
      {canModerate ? (
        <div className="flex items-center gap-1">
          <ActionPill
            tone="emerald"
            icon={Play}
            onClick={() => onAct("OPEN")}
            label="Open"
          />
          {market.status !== "PAUSED" ? (
            <ActionPill
              tone="amber"
              icon={Pause}
              onClick={() => onAct("PAUSED")}
              label="Pause"
            />
          ) : null}
          <ActionPill
            tone="rose"
            icon={Square}
            onClick={() => onAct("CLOSED")}
            label="Close"
          />
        </div>
      ) : null}
    </motion.li>
  );
}

function ActionPill({
  tone,
  icon: Icon,
  onClick,
  label,
}: {
  tone: "emerald" | "amber" | "rose";
  icon: typeof Play;
  onClick: () => void;
  label: string;
}) {
  const TONE = {
    emerald:
      "bg-emerald-500/12 text-emerald-200 ring-emerald-400/25 hover:bg-emerald-500/20",
    amber: "bg-amber-500/12 text-amber-200 ring-amber-400/25 hover:bg-amber-500/20",
    rose: "bg-rose-500/12 text-rose-200 ring-rose-400/25 hover:bg-rose-500/20",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider ring-1 transition",
        TONE[tone],
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
