import { MarketDetailsPage } from "@/widgets/market-details/market-details-page";

export default async function MarketSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MarketDetailsPage slug={decodeURIComponent(slug)} />;
}
