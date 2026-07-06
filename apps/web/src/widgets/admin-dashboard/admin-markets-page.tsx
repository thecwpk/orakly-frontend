"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminMarketsTab } from "./tabs/markets-tab";
import {
  AdminCommunitySubmissionsTab,
  useAdminPendingSubmissionsCount,
} from "./tabs/community-submissions-tab";

type MarketsPageTab = "catalog" | "community";

const PAGE_TABS: { id: MarketsPageTab; label: string }[] = [
  { id: "catalog", label: "Markets" },
  { id: "community", label: "Community Submissions" },
];

export function AdminMarketsPage({
  canCreate,
  canModerate,
  canResolve,
}: {
  canCreate: boolean;
  canModerate: boolean;
  canResolve: boolean;
}) {
  const [activeTab, setActiveTab] = useState<MarketsPageTab>("catalog");
  const pendingCount = useAdminPendingSubmissionsCount();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[var(--hub-bg-subtle)] p-1 ring-1 ring-[var(--hub-border)]">
        {PAGE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === "community" && pendingCount > 0;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold transition",
                isActive
                  ? "bg-[var(--hub-card-hover)] text-[var(--hub-fg)] ring-1 ring-[var(--hub-border-strong)]"
                  : "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="admin-markets-page-tab"
                  className="absolute inset-0 -z-0 rounded-lg ring-1 ring-[var(--hub-border-strong)]"
                  transition={{ type: "spring", stiffness: 460, damping: 32 }}
                />
              ) : null}
              <span className="relative z-10">{tab.label}</span>
              {showBadge ? (
                <span className="relative z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeTab === "catalog" ? (
        <AdminMarketsTab
          canCreate={canCreate}
          canModerate={canModerate}
          canResolve={canResolve}
        />
      ) : (
        <AdminCommunitySubmissionsTab canModerate={canModerate || canCreate} />
      )}
    </div>
  );
}
