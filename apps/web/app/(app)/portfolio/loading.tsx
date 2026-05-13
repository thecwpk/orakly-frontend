import { PortfolioDashboardSkeleton } from "@/widgets/portfolio-dashboard/components/portfolio-dashboard-skeleton";

export default function PortfolioLoading() {
  return (
    <div className="min-h-[50vh] pb-16 pt-6">
      <PortfolioDashboardSkeleton />
    </div>
  );
}
