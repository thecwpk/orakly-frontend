"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_TABS,
  hasPermission,
  visibleTabs,
  type AdminTabId,
} from "./lib/permissions";
import { useAdminMeQuery } from "./hooks/use-admin-queries";
import { AdminConsoleFrame } from "./components/admin-console-frame";
import { RoleGate } from "./components/role-gate";
import { AdminOverviewTab } from "./tabs/overview-tab";
import { AdminMarketsPage } from "./admin-markets-page";
import { AdminModerationTab } from "./tabs/moderation-tab";
import { AdminAnalyticsTab } from "./tabs/analytics-tab";
import { AdminUsersTab } from "./tabs/users-tab";
import { AdminCategoriesTab } from "./tabs/categories-tab";
import { ROUTES } from "@/shared/constants/routes";
import "@/widgets/admin-dashboard/admin-hub-scope.css";

export function AdminDashboardPage() {
  const meQ = useAdminMeQuery(true);
  const permissions = useMemo(() => meQ.data?.permissions ?? [], [meQ.data?.permissions]);
  const tabs = useMemo(() => visibleTabs(permissions), [permissions]);

  const [active, setActive] = useState<AdminTabId>("overview");

  useEffect(() => {
    if (tabs.length === 0) return;
    if (!tabs.some((t) => t.id === active)) {
      const first = tabs[0];
      if (first) setActive(first.id);
    }
  }, [tabs, active]);

  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  if (!activeTab) {
    return (
      <AdminConsoleFrame
        activeTab={null}
        onTabSelect={setActive}
        bootstrapReturnPath={ROUTES.adminDashboard}
      >
        {null}
      </AdminConsoleFrame>
    );
  }

  return (
    <AdminConsoleFrame
      activeTab={active}
      onTabSelect={setActive}
      bootstrapReturnPath={ROUTES.adminDashboard}
      contentKey={activeTab.id}
    >
      <AdminTabContent
        tab={activeTab.id}
        permissions={permissions}
        role={meQ.data?.role}
      />
    </AdminConsoleFrame>
  );
}

function AdminTabContent({
  tab,
  permissions,
  role,
}: {
  tab: AdminTabId;
  permissions: ReadonlyArray<string>;
  role?: string;
}) {
  const cfg = ADMIN_TABS.find((r) => r.id === tab);
  if (!cfg) return null;

  const canCreate = hasPermission(permissions, ["markets.write"]);
  const canModerate = hasPermission(permissions, ["markets.moderate"]);
  const canResolve = hasPermission(permissions, ["markets.resolve"]);
  const canManageCategories = hasPermission(permissions, ["categories.manage"]);

  switch (tab) {
    case "overview":
      return (
        <RoleGate permissions={permissions} required={cfg.required}>
          <AdminOverviewTab permissions={permissions} role={role} />
        </RoleGate>
      );
    case "markets":
      return (
        <RoleGate permissions={permissions} required={cfg.required}>
          <AdminMarketsPage
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
