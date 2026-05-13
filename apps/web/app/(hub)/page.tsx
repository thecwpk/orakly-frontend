import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { redirect } from "next/navigation";

const hubFallback = (
  <div className="mx-auto w-full max-w-[min(1420px,calc(100vw-32px))] animate-pulse space-y-4 px-4 py-12 sm:px-6 lg:px-10 xl:px-12">
    <div className="h-10 w-2/3 max-w-lg rounded-lg bg-white/[0.06]" />
    <div className="h-4 w-full max-w-xl rounded bg-white/[0.04]" />
    <div className="h-40 rounded-xl bg-white/[0.03]" />
  </div>
);

/** Explicit client chunk — avoids fragile server analysis of the hub barrel. */
const DappHubPage = dynamic(
  () =>
    import("@/widgets/dapp-hub/dapp-hub-page").then((m) => ({
      default: m.DappHubPage,
    })),
  { loading: () => hubFallback },
);

export const metadata: Metadata = {
  title: "Live prediction markets — Orakly",
  description:
    "Trade YES or NO on meme and crypto narratives — trending lanes, alpha drops, and the full directory.",
};

export default async function HubHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  if (sp.trending !== undefined) {
    const qs = new URLSearchParams();
    for (const [key, raw] of Object.entries(sp)) {
      if (raw === undefined) continue;
      if (Array.isArray(raw)) {
        for (const part of raw) qs.append(key, part);
      } else {
        qs.set(key, raw);
      }
    }
    redirect(`/markets?${qs.toString()}`);
  }

  return (
    <Suspense fallback={hubFallback}>
      <DappHubPage />
    </Suspense>
  );
}
