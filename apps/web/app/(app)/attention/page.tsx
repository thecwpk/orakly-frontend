import type { Metadata } from "next";
import { AttentionDashboardClient } from "@/widgets/attention/attention-dashboard-client";

export const metadata: Metadata = {
  title: "Attention Dashboard — Orakly",
  description: "Live crypto narrative intelligence, momentum heatmap, and rotation flows.",
};

export default function AttentionPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AttentionDashboardClient />
    </main>
  );
}
