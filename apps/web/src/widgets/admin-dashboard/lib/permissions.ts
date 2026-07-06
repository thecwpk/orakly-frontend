import {
  BarChart3,
  FolderTree,
  LayoutDashboard,
  Settings2,
  ShieldAlert,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

/**
 * Mirrors `AdminPermission` on the server. Keeping the strings in lockstep means
 * we can dispatch tab visibility entirely from the `/admin/me` permission set.
 */
export type AdminPermission =
  | "markets.write"
  | "markets.resolve"
  | "markets.moderate"
  | "categories.manage"
  | "users.manage"
  | "analytics.read";

export type AdminTabId =
  | "overview"
  | "markets"
  | "moderation"
  | "analytics"
  | "users"
  | "categories";

export type AdminTabConfig = {
  id: AdminTabId;
  label: string;
  description: string;
  icon: LucideIcon;
  /** All permissions required to even *see* the tab in the sidebar. */
  required: ReadonlyArray<AdminPermission>;
};

export type AdminSidebarLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  requiresRole?: "ADMIN";
};

export const ADMIN_SIDEBAR_LINKS: ReadonlyArray<AdminSidebarLink> = [
  {
    href: ROUTES.adminConfig,
    label: "Metrics Config",
    description: "Attention & conviction weights.",
    icon: Settings2,
    requiresRole: "ADMIN",
  },
];

export const ADMIN_TABS: ReadonlyArray<AdminTabConfig> = [
  {
    id: "overview",
    label: "Overview",
    description: "Realtime ops health, fees, queue.",
    icon: LayoutDashboard,
    required: ["analytics.read"],
  },
  {
    id: "markets",
    label: "Markets",
    description: "Create, moderate, resolve.",
    icon: Store,
    required: ["analytics.read"],
  },
  {
    id: "moderation",
    label: "Moderation",
    description: "Drafts + paused queue.",
    icon: ShieldAlert,
    required: ["markets.moderate"],
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Revenue + trading volume.",
    icon: BarChart3,
    required: ["analytics.read"],
  },
  {
    id: "users",
    label: "Users",
    description: "Roles, suspensions.",
    icon: Users,
    required: ["users.manage"],
  },
  {
    id: "categories",
    label: "Categories",
    description: "Discovery taxonomy.",
    icon: FolderTree,
    required: ["categories.manage"],
  },
];

/**
 * Stable list of *available* permissions a user can be granted. Used by the
 * Overview tile that surfaces the operator's effective scope.
 */
export const ALL_PERMISSIONS: ReadonlyArray<{
  id: AdminPermission;
  label: string;
  group: "Markets" | "Moderation" | "Users" | "Analytics" | "Taxonomy";
}> = [
  { id: "markets.write", label: "Create markets", group: "Markets" },
  { id: "markets.resolve", label: "Resolve markets", group: "Markets" },
  { id: "markets.moderate", label: "Moderate markets", group: "Moderation" },
  { id: "users.manage", label: "Manage users", group: "Users" },
  { id: "categories.manage", label: "Manage categories", group: "Taxonomy" },
  { id: "analytics.read", label: "Read analytics", group: "Analytics" },
];

export function hasPermission(
  granted: ReadonlyArray<string>,
  required: ReadonlyArray<AdminPermission>,
): boolean {
  if (required.length === 0) return true;
  const set = new Set(granted);
  return required.every((p) => set.has(p));
}

export function visibleTabs(
  permissions: ReadonlyArray<string>,
  registry: ReadonlyArray<AdminTabConfig> = ADMIN_TABS,
): AdminTabConfig[] {
  return registry.filter((t) => hasPermission(permissions, t.required));
}
