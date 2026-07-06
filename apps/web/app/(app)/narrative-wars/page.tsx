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
      <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="h-11 animate-pulse rounded-lg bg-gray-200" />
        <div className="hidden h-8 w-12 animate-pulse rounded bg-gray-200 sm:block" />
        <div className="h-11 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
    </div>
  );
}

export default function NarrativeWarsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<NarrativeWarsFallback />}>
        <NarrativeWarsClient />
      </Suspense>
    </main>
  );
}
