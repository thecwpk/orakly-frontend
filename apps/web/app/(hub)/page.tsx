import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LandingPage } from "@/widgets/landing/landing-page";

export const metadata: Metadata = {
  title: {
    absolute: "Orakly Market — YES/NO prediction markets, on-chain",
  },
  description:
    "Trade live YES/NO odds on crypto, macro, sports, and tech. Transparent rules, stablecoin rails, and verifiable on-chain settlement. Subscribe for product updates.",
  alternates: { canonical: "/" },
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
