"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Crown,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  User as UserIcon,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api";
import {
  adminUsersKey,
  useAdminUsersQuery,
  type AdminUserRow,
} from "../hooks/use-admin-queries";
import { Section, TabShell } from "../components/tab-shell";
import { ConfirmDialog } from "../components/confirm-dialog";
import { EmptyState } from "../components/empty-state";
import { compactUsd, parseDecimal, shortId } from "../lib/format";

const ROLE_FILTERS = ["ALL", "USER", "MODERATOR", "ADMIN"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];

type SuspendTarget = { id: string; label: string; suspend: boolean } | null;
type RoleTarget = { id: string; label: string; nextRole: string } | null;

const ROLE_TONE: Record<string, { ring: string; bg: string; text: string }> = {
  ADMIN: {
    ring: "ring-[var(--hub-border-strong)]",
    bg: "bg-[var(--hub-primary-soft)]",
    text: "text-[var(--hub-primary-bright)]",
  },
  MODERATOR: {
    ring: "ring-cyan-400/30",
    bg: "bg-cyan-500/12",
    text: "text-cyan-200",
  },
  USER: {
    ring: "ring-zinc-500/25",
    bg: "bg-zinc-500/10",
    text: "text-[var(--hub-muted)]",
  },
};

const ROLE_FALLBACK = ROLE_TONE.USER!;

function userLabel(u: AdminUserRow): string {
  return u.displayName ?? u.email ?? shortId(u.id);
}

export function AdminUsersTab() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [showSuspended, setShowSuspended] = useState<"all" | "active" | "suspended">(
    "all",
  );
  const [suspendTarget, setSuspendTarget] = useState<SuspendTarget>(null);
  const [roleTarget, setRoleTarget] = useState<RoleTarget>(null);

  const usersQ = useAdminUsersQuery(true);
  const qc = useQueryClient();

  const patch = useMutation({
    mutationFn: async (vars: {
      id: string;
      body: { role?: string; isSuspended?: boolean };
    }) =>
      adminApi(`/users/${vars.id}`, {
        method: "PATCH",
        json: vars.body,
      }),
    onSuccess: () => {
      toast.success("User updated");
      void qc.invalidateQueries({ queryKey: adminUsersKey });
      setSuspendTarget(null);
      setRoleTarget(null);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const filtered = useMemo(() => {
    const all = usersQ.data?.users ?? [];
    const q = query.trim().toLowerCase();
    return all.filter((u) => {
      if (role !== "ALL" && u.role !== role) return false;
      if (showSuspended === "active" && u.isSuspended) return false;
      if (showSuspended === "suspended" && !u.isSuspended) return false;
      if (!q) return true;
      return (
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.displayName ?? "").toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    });
  }, [usersQ.data?.users, query, role, showSuspended]);

  const counts = useMemo(() => {
    const all = usersQ.data?.users ?? [];
    return ROLE_FILTERS.reduce(
      (acc, k) => {
        acc[k] = k === "ALL" ? all.length : all.filter((u) => u.role === k).length;
        return acc;
      },
      {} as Record<RoleFilter, number>,
    );
  }, [usersQ.data?.users]);

  return (
    <TabShell
      eyebrow="Identity"
      title="Users"
      description="Search the registry, change roles, and suspend offenders. Self-suspension is blocked server-side."
      actions={
        <button
          type="button"
          onClick={() => void usersQ.refetch()}
          disabled={usersQ.isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--hub-bg-subtle)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", usersQ.isFetching && "animate-spin")} />
          Refresh
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--hub-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, name, or id…"
            className="w-full rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] py-2 pl-8 pr-7 text-[12.5px] text-[var(--hub-fg)] outline-none focus:border-[var(--hub-primary)]/50"
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
          {ROLE_FILTERS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setRole(k)}
              className={cn(
                "relative inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider transition",
                role === k
                  ? "bg-[var(--hub-card-hover)] text-[var(--hub-fg)]"
                  : "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]",
              )}
            >
              {role === k ? (
                <motion.span
                  layoutId="users-role-active"
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
        <select
          value={showSuspended}
          onChange={(e) =>
            setShowSuspended(e.target.value as "all" | "active" | "suspended")
          }
          className="rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--hub-fg)] outline-none focus:border-[var(--hub-primary)]/50"
        >
          <option value="all">Any status</option>
          <option value="active">Active only</option>
          <option value="suspended">Suspended only</option>
        </select>
      </div>

      <Section title={`${filtered.length} user${filtered.length === 1 ? "" : "s"}`}>
        <div className="overflow-x-auto">
          {usersQ.isLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-shimmer h-12 rounded-lg ring-1 ring-[var(--hub-border)]"
                />
              ))}
            </div>
          ) : usersQ.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load users"
              description={usersQ.error?.message ?? "Try refreshing."}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No users match"
              description="Adjust the filters or search query."
            />
          ) : (
            <table className="w-full min-w-[760px] border-collapse text-left text-[12.5px]">
              <thead className="bg-[var(--hub-bg-subtle)]/95 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--hub-muted)] backdrop-blur">
                <tr>
                  <th scope="col" className="px-3 py-2.5">User</th>
                  <th scope="col" className="px-3 py-2.5">Role</th>
                  <th scope="col" className="px-3 py-2.5">Wallet</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <motion.tbody layout className="divide-y divide-[var(--hub-border)] text-[var(--hub-muted)]">
                <AnimatePresence initial={false}>
                  {filtered.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      onSuspendToggle={() =>
                        setSuspendTarget({
                          id: u.id,
                          label: userLabel(u),
                          suspend: !u.isSuspended,
                        })
                      }
                      onRoleChange={(nextRole) =>
                        setRoleTarget({
                          id: u.id,
                          label: userLabel(u),
                          nextRole,
                        })
                      }
                    />
                  ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          )}
        </div>
      </Section>

      {usersQ.data?.nextCursor ? (
        <p className="text-center text-[10.5px] text-[var(--hub-muted)]">
          Showing the most recent {usersQ.data.users.length} accounts. Refine search
          to find older users.
        </p>
      ) : null}

      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(o) => (!o ? setSuspendTarget(null) : null)}
        tone="danger"
        title={
          suspendTarget?.suspend
            ? `Suspend ${suspendTarget.label}?`
            : `Unsuspend ${suspendTarget?.label ?? ""}?`
        }
        description={
          suspendTarget?.suspend ? (
            <span>
              The user will be barred from trading, depositing, and signing in. Open
              positions stay live but cannot be modified.
            </span>
          ) : (
            <span>
              Restoring access. The user can sign in and trade again immediately.
            </span>
          )
        }
        confirmLabel={suspendTarget?.suspend ? "Suspend" : "Unsuspend"}
        busy={patch.isPending}
        onConfirm={() => {
          if (!suspendTarget) return;
          patch.mutate({
            id: suspendTarget.id,
            body: { isSuspended: suspendTarget.suspend },
          });
        }}
      />

      <ConfirmDialog
        open={!!roleTarget}
        onOpenChange={(o) => (!o ? setRoleTarget(null) : null)}
        tone={roleTarget?.nextRole === "ADMIN" ? "danger" : "warning"}
        title={`Change role to ${roleTarget?.nextRole ?? ""}`}
        description={
          <span>
            Role for{" "}
            <span className="font-semibold text-[var(--hub-fg)]">{roleTarget?.label}</span> →{" "}
            <span className="font-semibold text-[var(--hub-fg)]">{roleTarget?.nextRole}</span>.
            {roleTarget?.nextRole === "ADMIN"
              ? " Admins can resolve markets, edit revenue settings, and manage users."
              : null}
            {roleTarget?.nextRole === "MODERATOR"
              ? " Moderators can pause and resolve markets, but cannot mint admins."
              : null}
            {roleTarget?.nextRole === "USER"
              ? " Operator privileges are revoked."
              : null}
          </span>
        }
        confirmLabel={`Apply ${roleTarget?.nextRole}`}
        busy={patch.isPending}
        onConfirm={() => {
          if (!roleTarget) return;
          patch.mutate({
            id: roleTarget.id,
            body: { role: roleTarget.nextRole },
          });
        }}
      />
    </TabShell>
  );
}

function UserRow({
  user,
  onSuspendToggle,
  onRoleChange,
}: {
  user: AdminUserRow;
  onSuspendToggle: () => void;
  onRoleChange: (nextRole: string) => void;
}) {
  const tone = ROLE_TONE[user.role] ?? ROLE_FALLBACK;
  const Icon =
    user.role === "ADMIN" ? Crown : user.role === "MODERATOR" ? Shield : UserIcon;

  const available = parseDecimal(
    typeof user.wallet?.availableBalance === "string" ||
      typeof user.wallet?.availableBalance === "number"
      ? user.wallet.availableBalance
      : 0,
  );

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
        <p className="truncate text-[var(--hub-fg)]">{userLabel(user)}</p>
        <p className="truncate font-mono text-[10.5px] text-[var(--hub-muted)]">
          {shortId(user.id)}
        </p>
      </td>
      <td className="px-3 py-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ring-1",
            tone.bg,
            tone.text,
            tone.ring,
          )}
        >
          <Icon className="h-2.5 w-2.5" />
          {user.role}
        </span>
      </td>
      <td className="px-3 py-2 font-mono text-[11px] text-[var(--hub-muted)]">
        {user.wallet ? compactUsd(available) : "N/A"}
      </td>
      <td className="px-3 py-2">
        {user.isSuspended ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-rose-200 ring-1 ring-rose-400/25">
            <ShieldOff className="h-2.5 w-2.5" />
            Suspended
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-200 ring-1 ring-emerald-400/25">
            <Shield className="h-2.5 w-2.5" />
            Active
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center justify-end gap-1">
          {user.role !== "MODERATOR" ? (
            <ActionPill
              tone="cyan"
              icon={Shield}
              onClick={() => onRoleChange("MODERATOR")}
              label="Make MOD"
            />
          ) : null}
          {user.role !== "USER" ? (
            <ActionPill
              tone="violet"
              icon={UserIcon}
              onClick={() => onRoleChange("USER")}
              label="To USER"
            />
          ) : null}
          <ActionPill
            tone={user.isSuspended ? "emerald" : "rose"}
            icon={user.isSuspended ? UserPlus : UserMinus}
            onClick={onSuspendToggle}
            label={user.isSuspended ? "Unsuspend" : "Suspend"}
          />
        </div>
      </td>
    </motion.tr>
  );
}

function ActionPill({
  tone,
  icon: Icon,
  onClick,
  label,
}: {
  tone: "emerald" | "amber" | "rose" | "cyan" | "violet";
  icon: typeof Shield;
  onClick: () => void;
  label: string;
}) {
  const TONE = {
    emerald:
      "bg-emerald-500/12 text-emerald-200 ring-emerald-400/25 hover:bg-emerald-500/20",
    amber: "bg-amber-500/12 text-amber-200 ring-amber-400/25 hover:bg-amber-500/20",
    rose: "bg-rose-500/12 text-rose-200 ring-rose-400/25 hover:bg-rose-500/20",
    cyan: "bg-cyan-500/12 text-cyan-200 ring-cyan-400/25 hover:bg-cyan-500/20",
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
