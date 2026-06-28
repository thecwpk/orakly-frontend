import type { ReactNode } from "react";
import { AdminAppShell } from "@/widgets/admin-dashboard/components/admin-app-shell";

/** Operator console — shares hub chrome with the trading app. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAppShell>{children}</AdminAppShell>;
}
