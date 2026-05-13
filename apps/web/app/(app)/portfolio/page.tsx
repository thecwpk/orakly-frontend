import type { Metadata } from "next";
import { PortfolioDashboardPage } from "@/widgets/portfolio-dashboard/portfolio-dashboard-page";

export const metadata: Metadata = {
  title: "Portfolio — Orakly",
  description:
    "Equity, PnL, positions, win rate, and trade history for the active session.",
};

export default function PortfolioPage() {
  return <PortfolioDashboardPage />;
}
