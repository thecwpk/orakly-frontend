import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LandingPage } from "@/widgets/landing/landing-page";

export const metadata: Metadata = {
  title: "Orakly Market — Crypto prediction markets",
  description:
    "Informational overview of Orakly: narrative-driven YES/NO markets, transparent pricing, and on-chain settlement — open the app to trade.",
};

/** Site entry — marketing landing at `/` (static content; open `/markets` to trade). */
export default async function HomePage({
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

  return <LandingPage />;
}
