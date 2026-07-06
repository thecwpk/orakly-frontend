import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { slugToDisplayName } from "@/lib/narrative-slug";
import { ROUTES } from "@/shared/constants/routes";
import { AttentionScoreCard } from "@/widgets/attention/components/attention-score-card";
import {
  buildNarrativeStats,
  getNarrativeBySlug,
} from "@/server/queries/narrative-detail";
import { NarrativeHistoryChart } from "@/widgets/narratives/narrative-history-chart";
import { NarrativeRelatedMarkets } from "@/widgets/narratives/narrative-related-markets";
import { NarrativeStatsTable } from "@/widgets/narratives/narrative-stats-table";

type NarrativePageProps = {
  params: Promise<{ slug: string }>;
};

function NarrativeNotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-7xl flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Narrative not found</h1>
      <p className="max-w-md text-sm text-gray-500">
        We could not find attention data for this narrative. It may have been removed or the URL
        is incorrect.
      </p>
      <Link
        href={ROUTES.attention}
        className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Back to Attention
      </Link>
    </main>
  );
}

export async function generateMetadata({ params }: NarrativePageProps): Promise<Metadata> {
  const { slug } = await params;
  const narrative = await getNarrativeBySlug(decodeURIComponent(slug));
  const fallbackName = slugToDisplayName(decodeURIComponent(slug));

  return {
    title: narrative
      ? `${narrative.narrativeName} — Narrative — Orakly`
      : `${fallbackName} — Narrative — Orakly`,
    description: narrative
      ? `Attention, conviction, and markets for the ${narrative.narrativeName} narrative.`
      : "Narrative intelligence on Orakly.",
  };
}

export default async function NarrativeDetailPage({ params }: NarrativePageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const narrative = await getNarrativeBySlug(slug);

  if (!narrative) {
    return <NarrativeNotFound />;
  }

  const displayName = slugToDisplayName(slug);
  const stats = await buildNarrativeStats(slug, narrative);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <Link href={ROUTES.home} className="transition hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        <Link href={ROUTES.attention} className="transition hover:text-gray-900">
          Attention
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        <span className="font-medium text-gray-900">{displayName}</span>
      </nav>

      <header className="mb-8 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {displayName}
        </h1>
        <div className="max-w-md">
          <AttentionScoreCard
            narrativeName={narrative.narrativeName}
            narrativeSlug={narrative.narrativeSlug}
            attentionScore={narrative.attentionScore}
            convictionScore={narrative.convictionScore}
            momentum={narrative.momentum}
            volume24hUsd={narrative.volume24hUsd}
            activeMarkets={narrative.activeMarkets}
            uniqueTraders={narrative.uniqueTraders}
            liquidity={narrative.liquidity}
            openInterest={narrative.openInterest}
          />
        </div>
      </header>

      <div className="space-y-10">
        <NarrativeHistoryChart slug={slug} />
        <NarrativeRelatedMarkets slug={slug} />
        <NarrativeStatsTable rows={stats} />
      </div>
    </main>
  );
}
