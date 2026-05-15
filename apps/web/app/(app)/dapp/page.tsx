import type { Metadata } from "next";
import { DappHubPage } from "@/widgets/dapp-hub";

export const metadata: Metadata = {
  title: "Orakly — Trading hub",
  description:
    "Live prediction market hub — trending tape, spotlight markets, and realtime activity.",
};

export default function DappHomePage() {
  return <DappHubPage />;
}
