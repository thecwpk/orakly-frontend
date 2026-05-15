import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketingDiscoverPage } from "@/widgets/marketing-discover";

export const metadata: Metadata = {
  title: "Discover markets — Orakly",
  description:
    "Browse live prediction markets with hub-style lanes, category filters, and real headlines from trusted publishers (Google News RSS; optional NewsAPI).",
};

function DiscoverFallback() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-6xl items-center justify-center px-4 py-16 text-sm text-muted-foreground">
      Loading discover…
    </div>
  );
}

/** Uses global app shell + marketing nav (`AppMarketingChromeHeader`). */
export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverFallback />}>
      <MarketingDiscoverPage />
    </Suspense>
  );
}
