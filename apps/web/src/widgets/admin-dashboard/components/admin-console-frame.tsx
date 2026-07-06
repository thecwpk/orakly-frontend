"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/shared/constants/routes";
import {
  AdminApiError,
  adminLogout,
  adminMeQueryKey,
  type AdminMe,
} from "../lib/admin-api";
import { useAdminMeQuery } from "../hooks/use-admin-queries";
import { useAdminWalletBootstrap } from "../hooks/use-admin-wallet-bootstrap";
import {
  ADMIN_SIDEBAR_LINKS,
  visibleTabs,
  type AdminTabConfig,
  type AdminTabId,
} from "../lib/permissions";
import { adminUi } from "../lib/admin-ui-classes";
import { AdminSidebar } from "./admin-sidebar";
import { AdminSidebarDrawer } from "./admin-sidebar-drawer";
import { AdminTopbar } from "./admin-topbar";

export type AdminConsoleFrameProps = {
  children: ReactNode;
  /** Active in-page tab; `null` when on a standalone route (e.g. metrics config). */
  activeTab: AdminTabId | null;
  onTabSelect: (id: AdminTabId) => void;
  bootstrapReturnPath: string;
  /** Mobile section header when `activeTab` is null. */
  mobileTitle?: string;
  /** Optional motion key for main content transitions. */
  contentKey?: string;
};

export function AdminConsoleFrame({
  children,
  activeTab,
  onTabSelect,
  bootstrapReturnPath,
  mobileTitle,
  contentKey,
}: AdminConsoleFrameProps) {
  const router = useRouter();
  const pathname = usePathname();
  const meQ = useAdminMeQuery(true);
  const qc = useQueryClient();
  const { state: bootstrapState, walletOperator, bootstrap } =
    useAdminWalletBootstrap(bootstrapReturnPath);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
  const tabs: AdminTabConfig[] = useMemo(
    () => visibleTabs(me?.permissions ?? []),
    [me?.permissions],
  );

  const sidebarLinks = useMemo(
    () =>
      me?.role === "ADMIN"
        ? ADMIN_SIDEBAR_LINKS.filter(
            (link) => !link.requiresRole || link.requiresRole === me.role,
          )
        : [],
    [me?.role],
  );

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

  const activeTabConfig =
    activeTab != null ? tabs.find((t) => t.id === activeTab) ?? null : null;

  const handleTabSelect = (id: AdminTabId) => {
    onTabSelect(id);
    setDrawerOpen(false);
  };

  return (
    <>
      <AdminTopbar
        active={activeTabConfig}
        sectionLabel={mobileTitle}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      <div className="hub-container flex min-h-[50vh] max-w-[1600px] gap-6 px-3 py-6 sm:px-4 lg:gap-8 lg:px-6 lg:py-8">
        <div className="hidden shrink-0 lg:block">
          <AdminSidebar
            tabs={tabs}
            active={activeTab}
            onSelect={onTabSelect}
            email={me.email}
            role={me.role}
            onSignOut={() => signOut.mutate()}
            externalLinks={sidebarLinks}
            pathname={pathname}
          />
        </div>

        <AdminSidebarDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <AdminSidebar
            tabs={tabs}
            active={activeTab}
            onSelect={handleTabSelect}
            email={me.email}
            role={me.role}
            onSignOut={() => signOut.mutate()}
            externalLinks={sidebarLinks}
            pathname={pathname}
          />
        </AdminSidebarDrawer>

        <main className="hub-root hub-admin min-w-0 flex-1">
          <motion.div
            key={contentKey ?? activeTab ?? pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </>
  );
}
