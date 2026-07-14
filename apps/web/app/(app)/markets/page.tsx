import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketsExplorerPage } from "@/widgets/markets-explorer/markets-explorer-page";

export const metadata: Metadata = {
  title: "Markets — Orakly",
  description: "Browse, search, and filter every prediction market on Orakly.",
};

function MarketsPageFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5 h-10 w-40 animate-pulse rounded bg-zinc-800/80" />
      <div className="mb-4 h-12 w-full animate-pulse rounded-xl bg-zinc-800/80" />
      <div className="overflow-hidden rounded-xl border border-white/[0.08]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse border-b border-white/[0.06] bg-zinc-900/40"
          />
        ))}
      </div>
    </div>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={<MarketsPageFallback />}>
      <MarketsExplorerPage />
    </Suspense>
  );
}
