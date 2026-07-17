import type { Metadata } from "next";
import { WalletPage } from "@/widgets/wallet/wallet-page";

export const metadata: Metadata = {
  title: "Wallet: Orakly",
  description:
    "On-chain and custodial balances, network status, recent transactions, and deposit / withdraw flows.",
};

export default function WalletRoute() {
  return <WalletPage />;
}
