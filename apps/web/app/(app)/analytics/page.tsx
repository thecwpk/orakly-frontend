import type { Metadata } from "next";
import { HistoricalAnalyticsPage } from "@/widgets/analytics/historical-analytics-page";

export const metadata: Metadata = {
  title: "Analytics: Orakly",
  description:
    "Historical attention, conviction, volume, and resolved-market outcomes over custom time windows on Orakly.",
};

export default function AnalyticsRoute() {
  return <HistoricalAnalyticsPage />;
}
