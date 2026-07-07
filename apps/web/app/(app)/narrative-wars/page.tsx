import type { Metadata } from "next";
import { Suspense } from "react";
import { NarrativeWarsClient } from "@/widgets/narrative-wars/narrative-wars-client";

export const metadata: Metadata = {
  title: "Narrative Wars — Orakly",
  description: "Head-to-head comparison of crypto narrative attention, conviction, and markets.",
};

function NarrativeWarsFallback() {
  return (
    <div className="space-y-8">
      <div className="h-20 animate-pulse rounded-xl bg-zinc-800/80" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="h-11 animate-pulse rounded-xl bg-zinc-800/80" />
        <div className="hidden h-8 w-12 animate-pulse rounded bg-zinc-800/80 sm:block" />
        <div className="h-11 animate-pulse rounded-xl bg-zinc-800/80" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-zinc-800/80" />
    </div>
  );
}

export default function NarrativeWarsPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 pb-s64 pt-s48 md:pt-s56">
      <Suspense fallback={<NarrativeWarsFallback />}>
        <NarrativeWarsClient />
      </Suspense>
    </main>
  );
}
