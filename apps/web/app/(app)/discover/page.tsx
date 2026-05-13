import type { Metadata } from "next";
import { MarketingDiscoverPage } from "@/widgets/marketing-discover";

export const metadata: Metadata = {
  title: "Discover markets — Orakly",
  description:
    "Browse live prediction markets with hub-style lanes, category filters, and real headlines from trusted publishers (Google News RSS; optional NewsAPI).",
};

/** Uses global app shell + marketing nav (`AppMarketingChromeHeader`). */
export default function DiscoverPage() {
  return <MarketingDiscoverPage />;
}
