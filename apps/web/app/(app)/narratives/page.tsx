import type { Metadata } from "next";
import { AttentionDashboardClient } from "@/widgets/attention/attention-dashboard-client";

export const metadata: Metadata = {
  title: "Narratives: Orakly",
  description: "Explore crypto attention by narrative category.",
};

/** `/narratives` — Market Pulse CTA + top-nav Narratives destination. */
export default function NarrativesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <AttentionDashboardClient />
    </main>
  );
}
