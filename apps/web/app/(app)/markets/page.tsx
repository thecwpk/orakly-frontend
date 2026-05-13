import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ensureDiscoveryTrendingSearchParam } from "@/server/navigation/ensure-discovery-trending-param";
import { Container, Section } from "@/shared/ui";
import { MarketsListSkeleton } from "@/widgets/markets-explorer";

const MarketsExplorerPage = dynamic(
  () =>
    import("@/widgets/markets-explorer/markets-explorer-page").then((m) => ({
      default: m.MarketsExplorerPage,
    })),
  {
    loading: () => (
      <Section spacing="tight" width="xl">
        <Container width="xl" className="pt-r24">
          <MarketsListSkeleton count={12} />
        </Container>
      </Section>
    ),
  },
);

export const metadata: Metadata = {
  title: "Markets — Orakly",
  description:
    "Search, filter and sort every prediction market on Orakly — by category, sort, trending status, or watchlist.",
};

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  ensureDiscoveryTrendingSearchParam("/markets", sp);
  return <MarketsExplorerPage />;
}
