"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  FolderTree,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api";
import {
  adminCategoriesKey,
  useAdminCategoriesQuery,
  type AdminCategoryRow,
} from "../hooks/use-admin-queries";
import { Section, TabShell } from "../components/tab-shell";
import { ConfirmDialog } from "../components/confirm-dialog";
import { EmptyState } from "../components/empty-state";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 96);
}

export function AdminCategoriesTab({ canManage }: { canManage: boolean }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryRow | null>(null);

  const categoriesQ = useAdminCategoriesQuery(true);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () =>
      adminApi("/categories", {
        method: "POST",
        json: { name: name.trim(), slug: slug.trim() },
      }),
    onSuccess: () => {
      toast.success("Category created");
      setName("");
      setSlug("");
      void qc.invalidateQueries({ queryKey: adminCategoriesKey });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Create failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) =>
      adminApi(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Category deleted");
      void qc.invalidateQueries({ queryKey: adminCategoriesKey });
      setDeleteTarget(null);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const filtered = useMemo(() => {
    const all = categoriesQ.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q),
    );
  }, [categoriesQ.data, query]);

  const onNameChange = (v: string) => {
    setName(v);
    if (autoSlug) setSlug(slugify(v));
  };

  const canSubmit =
    canManage && name.trim().length >= 2 && slug.trim().length >= 2 && !create.isPending;

  return (
    <TabShell
      eyebrow="Taxonomy"
      title="Categories"
      description="Drives discovery rails and landing-page filters. Removing a category does not delete its markets."
      actions={
        <button
          type="button"
          onClick={() => void categoriesQ.refetch()}
          disabled={categoriesQ.isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[12px] font-medium text-zinc-200 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", categoriesQ.isFetching && "animate-spin")}
          />
          Refresh
        </button>
      }
    >
      {canManage ? (
        <Section title="Add new category" description="Slug is auto-generated.">
          <div className="grid gap-2 px-4 py-3 sm:grid-cols-[2fr_2fr_auto] sm:px-5">
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Name (e.g. Politics)"
              className="rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-[13px] text-white outline-none focus:border-violet-500/50"
            />
            <div className="relative">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={autoSlug}
                placeholder="slug"
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 pr-16 font-mono text-[13px] text-white outline-none focus:border-violet-500/50 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setAutoSlug((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300 ring-1 ring-white/[0.08] hover:bg-white/[0.08]"
              >
                {autoSlug ? "Auto" : "Manual"}
              </button>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.99 }}
              disabled={!canSubmit}
              onClick={() => create.mutate()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3 py-2.5 text-[12.5px] font-bold text-white shadow-[0_8px_30px_-8px_rgba(167,139,250,0.6)] ring-1 ring-violet-400/40 transition hover:brightness-110 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </motion.button>
          </div>
        </Section>
      ) : (
        <Section>
          <EmptyState
            icon={FolderTree}
            title="Read-only access"
            description="Your role can view the taxonomy but cannot edit it."
          />
        </Section>
      )}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories…"
          className="w-full rounded-xl border border-white/[0.08] bg-black/30 py-2 pl-8 pr-7 text-[12.5px] text-white outline-none focus:border-violet-500/50"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md bg-white/[0.04] text-zinc-400 ring-1 ring-white/[0.08] hover:bg-white/[0.08]"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      <Section title={`${filtered.length} categor${filtered.length === 1 ? "y" : "ies"}`}>
        {categoriesQ.isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer h-12 rounded-lg ring-1 ring-white/[0.04]"
              />
            ))}
          </div>
        ) : categoriesQ.isError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load categories"
            description={categoriesQ.error?.message ?? "Try refreshing."}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories"
            description={
              query ? "Adjust the search query." : "Add the first category above."
            }
          />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            <AnimatePresence initial={false}>
              {filtered.map((c) => (
                <motion.li
                  key={c.id}
                  layout="position"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-zinc-100">
                      {c.name}
                    </p>
                    <p className="truncate font-mono text-[10.5px] text-zinc-500">
                      {c.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-zinc-300 ring-1 ring-white/[0.08]">
                      {c._count.markets} markets
                    </span>
                    {canManage ? (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(c)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-500/12 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-rose-200 ring-1 ring-rose-400/25 transition hover:bg-rose-500/20"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Section>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => (!o ? setDeleteTarget(null) : null)}
        tone="danger"
        title={`Delete “${deleteTarget?.name ?? ""}”?`}
        description={
          <span>
            {(deleteTarget?._count.markets ?? 0) > 0 ? (
              <>
                This category has{" "}
                <span className="font-semibold text-white">
                  {deleteTarget?._count.markets} markets
                </span>{" "}
                {" "}— they&apos;ll keep existing but lose their category association.
              </>
            ) : (
              "Empty categories can be safely removed."
            )}
          </span>
        }
        confirmLabel="Delete"
        busy={remove.isPending}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id);
        }}
      />
    </TabShell>
  );
}
