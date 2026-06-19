import type { Metadata } from "next";
import { Suspense } from "react";
import { loadHubHomeBundle } from "@/server/queries/hub-home-bundle";
import { DappHubPage } from "@/widgets/dapp-hub";
import { HubHomeHydrator } from "@/widgets/dapp-hub/hub-home-hydrator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orakly — Crypto Attention Market",
  description: "Trade prediction markets — browse trending events and live odds.",
};

export default async function DappHomePage() {
  const initial = await loadHubHomeBundle();

  return (
    <HubHomeHydrator data={initial}>
      <Suspense fallback={null}>
        <DappHubPage />
      </Suspense>
    </HubHomeHydrator>
  );
}
