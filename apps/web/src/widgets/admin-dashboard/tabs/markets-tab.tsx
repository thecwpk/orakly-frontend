"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Filter,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Square,
  X,
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
  useAdminCategoriesQuery,
  useAdminMarketsQuery,
  type AdminMarketRow,
} from "../hooks/use-admin-queries";
import { Section, TabShell } from "../components/tab-shell";
import { StatusPill } from "../components/status-pill";
import { ConfirmDialog } from "../components/confirm-dialog";
import { CreateMarketDialog } from "../components/create-market-dialog";
import { EmptyState } from "../components/empty-state";
import { shortId } from "../lib/format";

const STATUS_FILTERS = ["ALL", "OPEN", "DRAFT", "PAUSED", "CLOSED", "RESOLVED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

type ResolveTarget = { id: string; title: string; outcome: "YES" | "NO" } | null;
type ModerateTarget = { id: string; title: string; status: string } | null;

export function AdminMarketsTab({
  canCreate,
  canModerate,
  canResolve,
}: {
  canCreate: boolean;
  canModerate: boolean;
  canResolve: boolean;
}) {
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<ResolveTarget>(null);
  const [moderateTarget, setModerateTarget] = useState<ModerateTarget>(null);

  const marketsQ = useAdminMarketsQuery(filter, true);
  const categoriesQ = useAdminCategoriesQuery(canCreate);

  const qc = useQueryClient();

  const moderateMutation = useMutation({
    mutationFn: async (vars: { id: string; status: string }) =>
      adminApi(`/markets/${vars.id}`, {
        method: "PATCH",
        json: { status: vars.status },
      }),
    onSuccess: () => {
      toast.success("Market updated");
      void qc.invalidateQueries({ queryKey: ["admin", "markets"] });
      void qc.invalidateQueries({ queryKey: adminOverviewKey });
      setModerateTarget(null);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const resolveMutation = useMutation({
    mutationFn: async (vars: { id: string; outcome: "YES" | "NO" }) =>
      adminApi(`/markets/${vars.id}/resolve`, {
        method: "POST",
        json: { outcome: vars.outcome },
      }),
    onSuccess: () => {
      toast.success("Market resolved");
      void qc.invalidateQueries({ queryKey: ["admin", "markets"] });
      void qc.invalidateQueries({ queryKey: adminOverviewKey });
      setResolveTarget(null);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Resolve failed"),
  });

  const filtered = useMemo(() => {
    const rows = marketsQ.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.category?.name.toLowerCase().includes(q) ?? false),
    );
  }, [marketsQ.data, query]);

  const counts = useMemo(() => {
    const all = marketsQ.data ?? [];
    return STATUS_FILTERS.reduce(
      (acc, k) => {
        acc[k] = k === "ALL" ? all.length : all.filter((m) => m.status === k).length;
        return acc;
      },
      {} as Record<StatusFilter, number>,
    );
  }, [marketsQ.data]);

  const reload = () => {
    void marketsQ.refetch();
    void qc.invalidateQueries({ queryKey: adminMarketsKey(filter, 80) });
  };

  return (
    <TabShell
      eyebrow="Lifecycle"
      title="Markets"
      description="Search the catalogue, moderate listings, and resolve outcomes. Every action is audit-logged."
      actions={
        <>
          <button
            type="button"
            onClick={reload}
            disabled={marketsQ.isFetching}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--hub-bg-subtle)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", marketsQ.isFetching && "animate-spin")}
            />
            Refresh
          </button>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--hub-primary)] to-cyan-600 px-3 py-1.5 text-[12px] font-bold text-white shadow-[0_8px_30px_-8px_rgba(167,139,250,0.6)] ring-1 ring-[var(--hub-border-strong)] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              New market
            </button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--hub-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, slug, id, or category…"
            className="w-full rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] py-2 pl-8 pr-7 text-[12.5px] text-white outline-none focus:border-[var(--hub-primary)]/50"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] hover:bg-[var(--hub-card-hover)]"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-[var(--hub-bg-subtle)] p-1 ring-1 ring-[var(--hub-border)]">
          {STATUS_FILTERS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                "relative inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider transition",
                filter === k
                  ? "bg-[var(--hub-card-hover)] text-white"
                  : "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]",
              )}
            >
              {filter === k ? (
                <motion.span
                  layoutId="markets-filter-active"
                  className="absolute inset-0 -z-0 rounded-lg ring-1 ring-[var(--hub-border-strong)]"
                  transition={{ type: "spring", stiffness: 460, damping: 32 }}
                />
              ) : null}
              <span className="relative z-10">{k}</span>
              <span className="relative z-10 rounded-md bg-[var(--hub-bg-subtle)] px-1 py-0.5 font-mono text-[9.5px] text-[var(--hub-muted)]">
                {counts[k]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Section
        title={`${filtered.length} market${filtered.length === 1 ? "" : "s"}`}
        action={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] text-[var(--hub-muted)]">
            <Filter className="h-3 w-3" />
            {filter} · {query ? `“${query}”` : "all"}
          </span>
        }
      >
        <div className="overflow-x-auto">
          {marketsQ.isLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-shimmer h-12 rounded-lg ring-1 ring-[var(--hub-border)]"
                />
              ))}
            </div>
          ) : marketsQ.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load markets"
              description={marketsQ.error?.message ?? "Try refreshing."}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No markets match"
              description={
                query
                  ? "Adjust the search or filters."
                  : "Create the first market with the button above."
              }
              action={
                canCreate && !query ? (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--hub-primary-soft)] px-3 py-1.5 text-[12px] font-bold text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border-strong)] transition hover:bg-violet-500/25"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create market
                  </button>
                ) : null
              }
            />
          ) : (
            <table className="w-full min-w-[820px] border-collapse text-left text-[12.5px]">
              <thead className="bg-[var(--hub-bg-subtle)]/95 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--hub-muted)] backdrop-blur">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Market</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-3 py-2.5">Category</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <motion.tbody
                layout
                className="divide-y divide-[var(--hub-border)] text-[var(--hub-muted)]"
              >
                <AnimatePresence initial={false}>
                  {filtered.map((m) => (
                    <MarketRow
                      key={m.id}
                      market={m}
                      canModerate={canModerate}
                      canResolve={canResolve}
                      onResolveYes={() =>
                        setResolveTarget({ id: m.id, title: m.title, outcome: "YES" })
                      }
                      onResolveNo={() =>
                        setResolveTarget({ id: m.id, title: m.title, outcome: "NO" })
                      }
                      onModerate={(status) =>
                        setModerateTarget({ id: m.id, title: m.title, status })
                      }
                    />
                  ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          )}
        </div>
      </Section>

      <CreateMarketDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        categories={categoriesQ.data ?? []}
      />

      <ConfirmDialog
        open={!!resolveTarget}
        onOpenChange={(o) => (!o ? setResolveTarget(null) : null)}
        tone={resolveTarget?.outcome === "YES" ? "info" : "danger"}
        title={`Resolve “${resolveTarget?.title ?? ""}” → ${resolveTarget?.outcome ?? ""}`}
        description={
          <span>
            Resolution is <span className="font-semibold text-white">irreversible</span>.
            Settlement engine will pay out winners, rebate losers&apos; open orders,
            and emit on-chain events.
          </span>
        }
        confirmLabel={`Resolve ${resolveTarget?.outcome}`}
        busy={resolveMutation.isPending}
        onConfirm={() => {
          if (!resolveTarget) return;
          resolveMutation.mutate({
            id: resolveTarget.id,
            outcome: resolveTarget.outcome,
          });
        }}
      />

      <ConfirmDialog
        open={!!moderateTarget}
        onOpenChange={(o) => (!o ? setModerateTarget(null) : null)}
        tone={moderateTarget?.status === "CLOSED" ? "danger" : "warning"}
        title={`Set status to ${moderateTarget?.status ?? ""}`}
        description={
          <span>
            “{moderateTarget?.title}” will move to{" "}
            <span className="font-semibold text-white">{moderateTarget?.status}</span>.
            {moderateTarget?.status === "PAUSED"
              ? " Trading is suspended; existing orders remain on book."
              : null}
            {moderateTarget?.status === "CLOSED"
              ? " Trading stops permanently. Pair this with a resolution shortly."
              : null}
            {moderateTarget?.status === "OPEN"
              ? " Trading resumes immediately."
              : null}
          </span>
        }
        confirmLabel={`Set ${moderateTarget?.status}`}
        busy={moderateMutation.isPending}
        onConfirm={() => {
          if (!moderateTarget) return;
          moderateMutation.mutate({
            id: moderateTarget.id,
            status: moderateTarget.status,
          });
        }}
      />
    </TabShell>
  );
}

function MarketRow({
  market,
  canModerate,
  canResolve,
  onResolveYes,
  onResolveNo,
  onModerate,
}: {
  market: AdminMarketRow;
  canModerate: boolean;
  canResolve: boolean;
  onResolveYes: () => void;
  onResolveNo: () => void;
  onModerate: (status: string) => void;
}) {
  return (
    <motion.tr
      layout="position"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="hover:bg-[var(--hub-card-hover)]"
    >
      <td className="max-w-[260px] px-3 py-2">
        <p className="line-clamp-2 font-medium text-[var(--hub-fg)]">{market.title}</p>
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
          <span className="font-mono text-[10px] text-[var(--hub-muted)]">{shortId(market.id)}</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <StatusPill status={market.status} />
      </td>
      <td className="px-3 py-2 text-[var(--hub-muted)]">
        {market.category?.name ?? <span className="text-[var(--hub-muted)]">—</span>}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center justify-end gap-1">
          {canModerate ? (
            <>
              {market.status !== "OPEN" ? (
                <ActionButton
                  tone="emerald"
                  icon={Play}
                  onClick={() => onModerate("OPEN")}
                  label="Open"
                />
              ) : null}
              {market.status === "OPEN" ? (
                <ActionButton
                  tone="amber"
                  icon={Pause}
                  onClick={() => onModerate("PAUSED")}
                  label="Pause"
                />
              ) : null}
              {market.status !== "CLOSED" && market.status !== "RESOLVED" ? (
                <ActionButton
                  tone="rose"
                  icon={Square}
                  onClick={() => onModerate("CLOSED")}
                  label="Close"
                />
              ) : null}
            </>
          ) : null}
          {canResolve &&
          (market.status === "OPEN" || market.status === "CLOSED") ? (
            <>
              <ActionButton
                tone="emerald"
                icon={CheckCircle2}
                onClick={onResolveYes}
                label="YES"
              />
              <ActionButton
                tone="rose"
                icon={X}
                onClick={onResolveNo}
                label="NO"
              />
            </>
          ) : null}
        </div>
      </td>
    </motion.tr>
  );
}

function ActionButton({
  tone,
  icon: Icon,
  onClick,
  label,
}: {
  tone: "emerald" | "amber" | "rose" | "violet";
  icon: typeof Play;
  onClick: () => void;
  label: string;
}) {
  const TONE = {
    emerald: "bg-emerald-500/12 text-emerald-200 ring-emerald-400/25 hover:bg-emerald-500/20",
    amber: "bg-amber-500/12 text-amber-200 ring-amber-400/25 hover:bg-amber-500/20",
    rose: "bg-rose-500/12 text-rose-200 ring-rose-400/25 hover:bg-rose-500/20",
    violet: "bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-[var(--hub-border)] hover:bg-violet-500/20",
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
