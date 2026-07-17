import type { Metadata } from "next";
import { ActivityHubPage } from "@/widgets/activity/activity-hub-page";

export const metadata: Metadata = {
  title: "Activity: Orakly",
  description:
    "Realtime tape of fills, settlements, and platform statistics across every prediction market.",
};

export default function ActivityRoute() {
  return <ActivityHubPage />;
}
