"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Filter,
  Link2,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCompactUsd } from "@orakly/utils";
import { useDeployAdminMarket } from "@/features/chain-trading/hooks/use-deploy-admin-market";
import { useDeployAdminMarketsBulk } from "@/features/chain-trading/hooks/use-deploy-admin-markets-bulk";
import { bscTestnetAddressUrl } from "@/features/chain-trading/lib/chain-contract-env";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api";
import {
  ADMIN_MARKET_CATEGORIES,
} from "../components/create-market-dialog";
import {
  adminMarketsKey,
  adminOverviewKey,
  useAdminMarketsQuery,
  type AdminMarketRow,
} from "../hooks/use-admin-queries";
import { Section, TabShell } from "../components/tab-shell";
import { ConfirmDialog } from "../components/confirm-dialog";
import { CreateMarketDialog } from "../components/create-market-dialog";
import { EmptyState } from "../components/empty-state";
import { adminUi } from "../lib/admin-ui-classes";

const STATUS_FILTERS = ["ALL", "OPEN", "DRAFT", "PAUSED", "CLOSED", "RESOLVED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

type ResolveTarget = { id: string; title: string; outcome: "YES" | "NO" } | null;

type LifecycleKey = "db_only" | "live" | "resolved" | "paused";

const LIFECYCLE_BADGE: Record<
  LifecycleKey,
  { label: string; ring: string; bg: string; text: string }
> = {
  db_only: {
    label: "DB Only · Not Tradeable",
    ring: "ring-amber-400/30",
    bg: "bg-amber-500/10",
    text: "text-amber-200",
  },
  live: {
    label: "Live On-Chain",
    ring: "ring-emerald-400/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-200",
  },
  resolved: {
    label: "Resolved",
    ring: "ring-zinc-400/30",
    bg: "bg-zinc-500/10",
    text: "text-[var(--hub-muted)]",
  },
  paused: {
    label: "Paused",
    ring: "ring-rose-400/30",
    bg: "bg-rose-500/10",
    text: "text-rose-200",
  },
};

const CATEGORY_LABELS = Object.fromEntries(
  ADMIN_MARKET_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<string, string>;

function marketLifecycle(market: AdminMarketRow): LifecycleKey {
  if (market.status === "RESOLVED") return "resolved";
  if (market.status === "PAUSED") return "paused";
  if (market.onChainAddress && market.status === "OPEN") return "live";
  return "db_only";
}

function isDeployable(market: AdminMarketRow): boolean {
  return marketLifecycle(market) === "db_only";
}

function marketCategoryLabel(market: AdminMarketRow): string {
  const adminKey = market.generationMeta?.adminCategory;
  if (adminKey && CATEGORY_LABELS[adminKey]) return CATEGORY_LABELS[adminKey];
  return market.category?.name ?? "N/A";
}

function formatVolumeUsd(raw: string | number | undefined): string {
  const n = typeof raw === "string" ? Number.parseFloat(raw) : (raw ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  return formatCompactUsd(n);
}

function toDeployPayload(m: AdminMarketRow) {
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description,
    closesAt: m.closesAt,
    category: m.category,
    resolutionSource: m.resolutionSource,
    takerFeeBps: m.takerFeeBps,
    adminCategory: m.generationMeta?.adminCategory,
  };
}

export function AdminMarketsTab({
  canCreate,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const marketsQ = useAdminMarketsQuery(filter, true);
  const deployMarket = useDeployAdminMarket();
  const deployBulk = useDeployAdminMarketsBulk();
  const qc = useQueryClient();

  const filtered = useMemo(() => {
    const rows = marketsQ.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        marketCategoryLabel(m).toLowerCase().includes(q),
    );
  }, [marketsQ.data, query]);

  const deployableFiltered = useMemo(
    () => filtered.filter(isDeployable),
    [filtered],
  );

  const selectedDeployable = useMemo(() => {
    const byId = new Map((marketsQ.data ?? []).map((m) => [m.id, m]));
    return [...selectedIds]
      .map((id) => byId.get(id))
      .filter((m): m is AdminMarketRow => Boolean(m && isDeployable(m)));
  }, [marketsQ.data, selectedIds]);

  const allVisibleSelected =
    deployableFiltered.length > 0 &&
    deployableFiltered.every((m) => selectedIds.has(m.id));

  const toggleOne = useCallback((id: string, on: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const m of deployableFiltered) next.delete(m.id);
      } else {
        for (const m of deployableFiltered) next.add(m.id);
      }
      return next;
    });
  }, [allVisibleSelected, deployableFiltered]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const runBulkDeploy = async () => {
    if (selectedDeployable.length === 0) {
      toast.message("Select undeployed markets to deploy.");
      return;
    }
    try {
      await deployBulk.mutateAsync(selectedDeployable.map(toDeployPayload));
      clearSelection();
      void marketsQ.refetch();
    } catch {
      /* toast handled in hook */
    }
  };

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
    void qc.invalidateQueries({ queryKey: adminMarketsKey(filter, 120) });
  };

  const bulkBusy = deployBulk.isPending || deployMarket.isPending;

  return (
    <TabShell
      eyebrow="Lifecycle"
      title="Markets"
      description="Create markets in the database, then deploy on BNB Chain to enable trading. Bulk deploy uses one MetaMask confirmation."
      actions={
        <>
          <button
            type="button"
            onClick={reload}
            disabled={marketsQ.isFetching}
            className={adminUi.btnGhost}
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
              Create Market
            </button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--hub-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, slug, id, or category…"
            className={cn(adminUi.inputSm, "pl-8")}
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className={cn(adminUi.iconBtn, "absolute right-2 top-1/2 -translate-y-1/2")}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
        <div className={adminUi.segmentWrap}>
          {STATUS_FILTERS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                "relative inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider transition",
                filter === k ? adminUi.segmentActive : adminUi.segmentIdle,
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

      {canCreate && selectedDeployable.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2.5">
          <p className="text-[12.5px] text-emerald-100">
            <span className="font-semibold tabular-nums">
              {selectedDeployable.length}
            </span>{" "}
            undeployed market{selectedDeployable.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearSelection}
              disabled={bulkBusy}
              className={adminUi.btnGhost}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => void runBulkDeploy()}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-[12px] font-semibold text-emerald-100 ring-1 ring-emerald-400/35 transition hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <Link2 className="h-3.5 w-3.5" />
              {deployBulk.isPending
                ? "Deploying…"
                : `Deploy selected (${selectedDeployable.length}) · 1 confirm`}
            </button>
          </div>
        </div>
      ) : null}

      <Section
        title={`${filtered.length} market${filtered.length === 1 ? "" : "s"}`}
        action={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] text-[var(--hub-muted)]">
            <Filter className="h-3 w-3" />
            {filter} · {query ? `“${query}”` : "all"}
            {deployableFiltered.length > 0
              ? ` · ${deployableFiltered.length} deployable`
              : ""}
          </span>
        }
      >
        <div className="overflow-x-auto">
          {marketsQ.isLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(adminUi.skeleton, "h-12 rounded-lg")}
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
                    Create Market
                  </button>
                ) : null
              }
            />
          ) : (
            <table className="w-full min-w-[1000px] border-collapse text-left text-[12.5px]">
              <thead className={adminUi.tableHead}>
                <tr>
                  <th scope="col" className="w-10 px-3 py-2.5">
                    {canCreate ? (
                      <input
                        type="checkbox"
                        aria-label="Select all deployable markets"
                        checked={allVisibleSelected}
                        disabled={deployableFiltered.length === 0 || bulkBusy}
                        onChange={toggleAllVisible}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-[var(--hub-border-strong)] bg-[var(--hub-bg-subtle)] accent-[var(--hub-primary)]"
                      />
                    ) : null}
                  </th>
                  <th scope="col" className="px-3 py-2.5">Question</th>
                  <th scope="col" className="px-3 py-2.5">Category</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-3 py-2.5">On-Chain Address</th>
                  <th scope="col" className="px-3 py-2.5">Volume</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <motion.tbody layout className={adminUi.tableRow}>
                <AnimatePresence initial={false}>
                  {filtered.map((m) => (
                    <MarketRow
                      key={m.id}
                      market={m}
                      canCreate={canCreate}
                      canResolve={canResolve}
                      selected={selectedIds.has(m.id)}
                      selectable={canCreate && isDeployable(m)}
                      deployBusy={bulkBusy}
                      onToggleSelect={(on) => toggleOne(m.id, on)}
                      onDeploy={() =>
                        deployMarket.mutate(toDeployPayload(m))
                      }
                      onResolveYes={() =>
                        setResolveTarget({ id: m.id, title: m.title, outcome: "YES" })
                      }
                      onResolveNo={() =>
                        setResolveTarget({ id: m.id, title: m.title, outcome: "NO" })
                      }
                    />
                  ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          )}
        </div>
      </Section>

      <CreateMarketDialog open={showCreate} onOpenChange={setShowCreate} />

      <ConfirmDialog
        open={!!resolveTarget}
        onOpenChange={(o) => (!o ? setResolveTarget(null) : null)}
        tone={resolveTarget?.outcome === "YES" ? "info" : "danger"}
        title={`Resolve “${resolveTarget?.title ?? ""}” → ${resolveTarget?.outcome ?? ""}`}
        description={
          <span>
            Resolution is <span className="font-semibold text-[var(--hub-fg)]">irreversible</span>.
            Settlement engine will pay out winners and close the market.
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
    </TabShell>
  );
}

function MarketRow({
  market,
  canCreate,
  canResolve,
  selected,
  selectable,
  deployBusy,
  onToggleSelect,
  onDeploy,
  onResolveYes,
  onResolveNo,
}: {
  market: AdminMarketRow;
  canCreate: boolean;
  canResolve: boolean;
  selected: boolean;
  selectable: boolean;
  deployBusy: boolean;
  onToggleSelect: (on: boolean) => void;
  onDeploy: () => void;
  onResolveYes: () => void;
  onResolveNo: () => void;
}) {
  const lifecycle = marketLifecycle(market);
  const badge = LIFECYCLE_BADGE[lifecycle];
  const onChain = Boolean(market.onChainAddress);

  return (
    <motion.tr
      layout="position"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "hover:bg-[var(--hub-card-hover)]",
        selected && "bg-[var(--hub-primary-soft)]/40",
      )}
    >
      <td className="px-3 py-2">
        {selectable ? (
          <input
            type="checkbox"
            aria-label={`Select ${market.title}`}
            checked={selected}
            disabled={deployBusy}
            onChange={(e) => onToggleSelect(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer rounded border-[var(--hub-border-strong)] bg-[var(--hub-bg-subtle)] accent-[var(--hub-primary)]"
          />
        ) : (
          <span className="inline-block h-3.5 w-3.5" aria-hidden />
        )}
      </td>
      <td className="max-w-[280px] px-3 py-2">
        <p className="line-clamp-2 font-medium text-[var(--hub-fg)]">{market.title}</p>
      </td>
      <td className="px-3 py-2 text-[var(--hub-muted)]">{marketCategoryLabel(market)}</td>
      <td className="px-3 py-2">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1",
            badge.bg,
            badge.text,
            badge.ring,
          )}
        >
          {badge.label}
        </span>
      </td>
      <td className="px-3 py-2">
        {onChain ? (
          <a
            href={bscTestnetAddressUrl(market.onChainAddress!)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[10.5px] text-emerald-200 hover:text-emerald-100"
          >
            {market.onChainAddress!.slice(0, 8)}…{market.onChainAddress!.slice(-4)}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-[10.5px] text-[var(--hub-muted)]">N/A</span>
        )}
      </td>
      <td className="px-3 py-2 font-mono text-[11px] tabular-nums text-[var(--hub-muted)]">
        {formatVolumeUsd(market.volumeTotalUsd)}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center justify-end gap-1">
          {lifecycle === "db_only" && canCreate ? (
            <ActionButton
              tone="amber"
              icon={Link2}
              onClick={onDeploy}
              label="Deploy On-Chain"
              disabled={deployBusy}
            />
          ) : null}
          {lifecycle === "live" && canResolve ? (
            <>
              <ActionButton
                tone="emerald"
                icon={CheckCircle2}
                onClick={onResolveYes}
                label="Resolve YES"
              />
              <ActionButton
                tone="rose"
                icon={X}
                onClick={onResolveNo}
                label="Resolve NO"
              />
              {onChain ? (
                <a
                  href={bscTestnetAddressUrl(market.onChainAddress!)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View on BSCScan"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] hover:text-[var(--hub-fg)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </>
          ) : null}
          {lifecycle === "resolved" ? (
            <Link
              href={`/markets/${market.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--hub-bg-subtle)] px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)]"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </Link>
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
  disabled,
}: {
  tone: "emerald" | "amber" | "rose";
  icon: typeof CheckCircle2;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  const TONE = {
    emerald: "bg-emerald-500/12 text-emerald-200 ring-emerald-400/25 hover:bg-emerald-500/20",
    amber: "bg-amber-500/12 text-amber-200 ring-amber-400/25 hover:bg-amber-500/20",
    rose: "bg-rose-500/12 text-rose-200 ring-rose-400/25 hover:bg-rose-500/20",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider ring-1 transition disabled:cursor-not-allowed disabled:opacity-40",
        TONE[tone],
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
