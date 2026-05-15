import { Suspense } from "react";
import { MarketDetailsPage } from "@/widgets/market-details/market-details-page";

export default async function MarketSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={null}>
      <MarketDetailsPage slug={decodeURIComponent(slug)} />
    </Suspense>
  );
}
