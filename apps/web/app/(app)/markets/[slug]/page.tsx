import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketDetailsPage } from "@/widgets/market-details/market-details-page";
import { MarketDetailsSkeleton } from "@/widgets/market-details/components/market-details-skeleton";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  return {
    title: `${decoded}: Orakly`,
    description: "Trade this prediction market on Orakly.",
  };
}

export default async function MarketSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <Suspense fallback={<MarketDetailsSkeleton />}>
      <MarketDetailsPage slug={decodeURIComponent(slug)} />
    </Suspense>
  );
}
