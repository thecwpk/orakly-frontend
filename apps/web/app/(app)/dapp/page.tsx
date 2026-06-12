import type { Metadata } from "next";
import { DappHubPage } from "@/widgets/dapp-hub";

export const metadata: Metadata = {
  title: "Orakly — Crypto Attention Market",
  description:
    "Attention-first narrative exchange — live attention scores, narrative wars, and conviction markets.",
};

export default function DappHomePage() {
  return <DappHubPage />;
}
