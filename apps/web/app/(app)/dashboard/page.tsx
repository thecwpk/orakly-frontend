import type { Metadata } from "next";
import { UserDashboardPage } from "@/widgets/user-dashboard/user-dashboard-page";

export const metadata: Metadata = {
  title: "Dashboard: Orakly",
  description: "Your portfolio, activity, and analytics shortcuts.",
};

export default function DashboardRoutePage() {
  return <UserDashboardPage />;
}
