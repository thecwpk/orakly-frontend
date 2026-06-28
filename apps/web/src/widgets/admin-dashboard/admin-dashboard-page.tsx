"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminApiError,
  adminLogout,
  adminMeQueryKey,
  type AdminMe,
} from "./lib/admin-api";
import {
  ADMIN_TABS,
  hasPermission,
  visibleTabs,
  type AdminTabConfig,
  type AdminTabId,
} from "./lib/permissions";
import { useAdminMeQuery } from "./hooks/use-admin-queries";
import { AdminSidebar } from "./components/admin-sidebar";
import { AdminTopbar } from "./components/admin-topbar";
import { AdminSidebarDrawer } from "./components/admin-sidebar-drawer";
import { RoleGate } from "./components/role-gate";
import { AdminOverviewTab } from "./tabs/overview-tab";
import { AdminMarketsTab } from "./tabs/markets-tab";
import { AdminModerationTab } from "./tabs/moderation-tab";
import { AdminAnalyticsTab } from "./tabs/analytics-tab";
import { AdminUsersTab } from "./tabs/users-tab";
import { AdminCategoriesTab } from "./tabs/categories-tab";
import { useAdminWalletBootstrap } from "./hooks/use-admin-wallet-bootstrap";
import { ROUTES } from "@/shared/constants/routes";
import { adminUi } from "./lib/admin-ui-classes";
import "@/widgets/admin-dashboard/admin-hub-scope.css";

export function AdminDashboardPage() {
  const router = useRouter();
  const meQ = useAdminMeQuery(true);
  const qc = useQueryClient();
  const { state: bootstrapState, walletOperator, bootstrap } =
    useAdminWalletBootstrap(ROUTES.adminDashboard);

  // Bootstrap-style redirect when the cookie is missing/expired.
  useEffect(() => {
    if (
      meQ.isError &&
      meQ.error instanceof AdminApiError &&
      meQ.error.status === 401
    ) {
      if (bootstrapState === "booting") return;
      if (walletOperator) {
        void bootstrap().then((ok) => {
          if (ok) void qc.invalidateQueries({ queryKey: adminMeQueryKey });
          else router.replace(ROUTES.adminLogin);
        });
        return;
      }
      router.replace(ROUTES.adminLogin);
    }
  }, [
    bootstrap,
    bootstrapState,
    meQ.error,
    meQ.isError,
    qc,
    router,
    walletOperator,
  ]);

  const me: AdminMe | undefined = meQ.data;
  const permissions = useMemo(() => me?.permissions ?? [], [me?.permissions]);

  const tabs: AdminTabConfig[] = useMemo(
    () => visibleTabs(permissions),
    [permissions],
  );

  const [active, setActive] = useState<AdminTabId>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // If our active tab disappears (e.g. permissions changed mid-session), fall
  // back to the first visible tab.
  useEffect(() => {
    if (tabs.length === 0) return;
    if (!tabs.some((t) => t.id === active)) {
      const first = tabs[0];
      if (first) setActive(first.id);
    }
  }, [tabs, active]);

  const signOut = useMutation({
    mutationFn: () => adminLogout(),
    onSuccess: () => {
      toast.success("Signed out");
      qc.removeQueries({ queryKey: ["admin"] });
      router.replace(ROUTES.adminLogin);
    },
    onError: () => toast.error("Sign-out failed"),
  });

  if (meQ.isLoading || bootstrapState === "booting") {
    return (
      <div className="hub-container flex min-h-[50vh] items-center justify-center text-[var(--hub-muted)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--hub-primary-bright)]" />
      </div>
    );
  }

  if (!me) {
    // 401 redirect is in flight; render nothing to avoid flashing UI.
    return null;
  }

  if (tabs.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-r16 px-r16 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <h1 className="text-lg font-semibold text-[var(--hub-fg)]">No operator scope</h1>
        <p className="max-w-sm text-[12.5px] text-[var(--hub-muted)]">
          Your account is registered as <span className="font-mono">{me.role}</span>{" "}
          but no admin permissions are granted. Ask a platform admin to enable scopes.
        </p>
        <button
          type="button"
          onClick={() => signOut.mutate()}
          className={adminUi.btnGhost}
        >
          Sign out
        </button>
      </div>
    );
  }

  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0]!;

  return (
    <>
      <AdminTopbar active={activeTab} onOpenDrawer={() => setDrawerOpen(true)} />

      <div className="hub-container flex min-h-[50vh] max-w-[1600px] gap-6 px-3 py-6 sm:px-4 lg:gap-8 lg:px-6 lg:py-8">
        {/* Desktop sidebar */}
        <div className="hidden shrink-0 lg:block">
          <AdminSidebar
            tabs={tabs}
            active={active}
            onSelect={setActive}
            email={me.email}
            role={me.role}
            onSignOut={() => signOut.mutate()}
          />
        </div>

        {/* Mobile drawer */}
        <AdminSidebarDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <AdminSidebar
            tabs={tabs}
            active={active}
            onSelect={(id) => {
              setActive(id);
              setDrawerOpen(false);
            }}
            email={me.email}
            role={me.role}
            onSignOut={() => signOut.mutate()}
          />
        </AdminSidebarDrawer>

        <main className="hub-root hub-admin min-w-0 flex-1">
          <motion.div
            key={activeTab.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AdminTabContent
              tab={activeTab.id}
              permissions={permissions}
              registry={ADMIN_TABS}
            />
          </motion.div>
        </main>
      </div>
    </>
  );
}

function AdminTabContent({
  tab,
  permissions,
  registry,
}: {
  tab: AdminTabId;
  permissions: ReadonlyArray<string>;
  registry: ReadonlyArray<AdminTabConfig>;
}) {
  const cfg = registry.find((r) => r.id === tab);
  if (!cfg) return null;

  const canCreate = hasPermission(permissions, ["markets.write"]);
  const canModerate = hasPermission(permissions, ["markets.moderate"]);
  const canResolve = hasPermission(permissions, ["markets.resolve"]);
  const canManageCategories = hasPermission(permissions, ["categories.manage"]);

  switch (tab) {
    case "overview":
      return (
        <RoleGate permissions={permissions} required={cfg.required}>
          <AdminOverviewTab permissions={permissions} />
        </RoleGate>
      );
    case "markets":
      return (
        <RoleGate permissions={permissions} required={cfg.required}>
          <AdminMarketsTab
            canCreate={canCreate}
            canModerate={canModerate}
            canResolve={canResolve}
          />
        </RoleGate>
      );
    case "moderation":
      return (
        <RoleGate permissions={permissions} required={cfg.required}>
          <AdminModerationTab canModerate={canModerate} />
        </RoleGate>
      );
    case "analytics":
      return (
        <RoleGate permissions={permissions} required={cfg.required}>
          <AdminAnalyticsTab />
        </RoleGate>
      );
    case "users":
      return (
        <RoleGate permissions={permissions} required={cfg.required}>
          <AdminUsersTab />
        </RoleGate>
      );
    case "categories":
      return (
        <RoleGate permissions={permissions} required={cfg.required}>
          <AdminCategoriesTab canManage={canManageCategories} />
        </RoleGate>
      );
    default:
      return null;
  }
}
