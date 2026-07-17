import type { Metadata } from "next";
import { PortfolioPage } from "@/widgets/portfolio/portfolio-page";

export const metadata: Metadata = {
  title: "Portfolio: Orakly",
  description:
    "Track open and closed positions, PnL, pending claims, trading history, watchlist, and creator earnings on Orakly.",
};

export default function PortfolioRoute() {
  return <PortfolioPage />;
}
