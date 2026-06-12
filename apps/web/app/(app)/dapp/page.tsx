import type { Metadata } from "next";
import { loadHubHomeBundle } from "@/server/queries/hub-home-bundle";
import { DappHubPage } from "@/widgets/dapp-hub";
import { HubHomeHydrator } from "@/widgets/dapp-hub/hub-home-hydrator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orakly — Crypto Attention Market",
  description:
    "Attention-first narrative exchange — live attention scores, narrative wars, and conviction markets.",
};

export default async function DappHomePage() {
  const initial = await loadHubHomeBundle();

  return (
    <HubHomeHydrator data={initial}>
      <DappHubPage />
    </HubHomeHydrator>
  );
}
