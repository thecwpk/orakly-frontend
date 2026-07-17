import type { Metadata } from "next";
import { Suspense } from "react";
import { NarrativeWarsClient } from "@/widgets/narrative-wars/narrative-wars-client";

export const metadata: Metadata = {
  title: "Narrative Wars: Orakly",
  description:
    "Compare two crypto narratives head-to-head with side-by-side markets, volume, and attention on Orakly.",
};

function NarrativeWarsFallback() {
  return (
    <div className="space-y-8">
      <div className="h-16 animate-pulse rounded-xl bg-zinc-800/80" />
      <div className="flex justify-center gap-6">
        <div className="h-12 w-48 animate-pulse rounded-xl bg-zinc-800/80" />
        <div className="h-8 w-12 animate-pulse rounded bg-zinc-800/80" />
        <div className="h-12 w-48 animate-pulse rounded-xl bg-zinc-800/80" />
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-zinc-800/80" />
    </div>
  );
}

export default function NarrativeWarsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Suspense fallback={<NarrativeWarsFallback />}>
        <NarrativeWarsClient />
      </Suspense>
    </main>
  );
}
