import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
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
  title: "Market — Orakly",
  description:
    "Browse, search, and filter prediction markets on Orakly.",
};

export default async function MarketsPage() {
  return (
    <Suspense
      fallback={
        <Section spacing="tight" width="xl">
          <Container width="xl" className="pt-r24">
            <MarketsListSkeleton count={12} />
          </Container>
        </Section>
      }
    >
      <MarketsExplorerPage />
    </Suspense>
  );
}
