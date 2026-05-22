import type { Metadata } from "next";
import { MarketsBreakingDirectoryPage } from "@/widgets/markets-explorer/markets-breaking-directory-page";

export const metadata: Metadata = {
  title: "Breaking markets — Orakly",
  description:
    "Prediction markets with fresh live signals — same ranking as the hub Breaking rail.",
};

export default function MarketsBreakingPage() {
  return <MarketsBreakingDirectoryPage />;
}
