"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { hasPermission, type AdminPermission } from "../lib/permissions";

export type RoleGateProps = {
  permissions: ReadonlyArray<string>;
  required: ReadonlyArray<AdminPermission>;
  children: ReactNode;
  /** Custom forbidden node — defaults to a polite explainer. */
  fallback?: ReactNode;
};

/**
 * Frontend-only guard that hides a section from operators who lack the
 * required permission. The corresponding API routes also enforce permissions
 * server-side via `requireAdminPermission()` — this is purely UX defense in
 * depth so unauthorized users can never even *see* an action.
 */
export function RoleGate({ permissions, required, children, fallback }: RoleGateProps) {
  if (hasPermission(permissions, required)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-12 text-center">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30">
        <Lock className="h-4 w-4" />
      </span>
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-amber-100">Restricted area</p>
        <p className="max-w-sm text-[11.5px] text-amber-100/70">
          Your operator account is missing the {required.join(", ")} permission.
          Contact a platform admin if this is a mistake.
        </p>
      </div>
    </div>
  );
}
