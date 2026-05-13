import type { Metadata } from "next";
import { MarketCreatePage } from "@/widgets/market-create/market-create-page";

export const metadata: Metadata = {
  title: "Create market — Orakly",
  description:
    "Spin up a new prediction pool — define resolution, timeline, and seed liquidity in a five-step compact wizard.",
};

export default function CreateMarketRoute() {
  return <MarketCreatePage />;
}
