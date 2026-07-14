import type { Metadata } from "next";
import { PortfolioPage } from "@/widgets/portfolio/portfolio-page";

export const metadata: Metadata = {
  title: "Portfolio — Orakly",
  description:
    "Your positions, PnL, pending claims, trading history, watchlist, and creator earnings.",
};

export default function PortfolioRoute() {
  return <PortfolioPage />;
}
