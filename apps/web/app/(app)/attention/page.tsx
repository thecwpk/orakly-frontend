import type { Metadata } from "next";
import { HubAttentionDashboardPage } from "@/widgets/dapp-hub/hub-attention-dashboard-page";

export const metadata: Metadata = {
  title: "Attention — Orakly",
  description: "Narrative momentum, matchups, and community intelligence.",
};

export default function AttentionPage() {
  return <HubAttentionDashboardPage />;
}
