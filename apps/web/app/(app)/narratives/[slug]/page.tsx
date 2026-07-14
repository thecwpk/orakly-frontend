import type { Metadata } from "next";
import Link from "next/link";
import { slugToDisplayName } from "@/lib/narrative-slug";
import { ROUTES } from "@/shared/constants/routes";
import { getNarrativeBySlug } from "@/server/queries/narrative-detail";
import { NarrativeDetailClient } from "@/widgets/narratives/narrative-detail-client";

type NarrativePageProps = {
  params: Promise<{ slug: string }>;
};

function NarrativeNotFound({ name }: { name: string }) {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-7xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-zinc-100">Narrative not found</h1>
      <p className="max-w-md text-sm text-zinc-500">
        We could not find attention data for “{name}”. It may have been removed or the URL is
        incorrect.
      </p>
      <Link
        href={ROUTES.attention}
        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
      >
        Back to Narratives
      </Link>
    </main>
  );
}

export async function generateMetadata({ params }: NarrativePageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const narrative = await getNarrativeBySlug(decoded);
  const fallbackName = slugToDisplayName(decoded);

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
    return <NarrativeNotFound name={slugToDisplayName(slug)} />;
  }

  return <NarrativeDetailClient slug={slug} narrative={narrative} />;
}
