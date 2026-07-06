import { NextResponse } from "next/server";
import { prisma } from "@orakly/database";
import { ok, err } from "../../_lib/response";

type Classification = "gaining" | "losing" | "stable";

type NarrativeSnapshot = {
  slug: string;
  name: string;
  score: number;
  prev24hScore: number;
  delta: number;
  classification: Classification;
};

type RotationFlow = {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  magnitude: number;
  fromScore: number;
  toScore: number;
};

type RotationRank = {
  slug: string;
  name: string;
  delta: number;
  score: number;
};

type AttentionRotationPayload = {
  flows: RotationFlow[];
  gainers: RotationRank[];
  losers: RotationRank[];
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Number(value.toFixed(2))));
}

function slugKey(slug: string, narrative: string): string {
  const s = slug.trim();
  return s.length > 0 ? s : narrative.trim().toLowerCase().replace(/\s+/g, "-");
}

function displayName(narrativeName: string, narrative: string): string {
  const name = narrativeName.trim();
  return name.length > 0 ? name : narrative;
}

function classify(delta: number): Classification {
  if (delta > 5) return "gaining";
  if (delta < -5) return "losing";
  return "stable";
}

function resolvePrev24hScore(
  latest: { score: { toString(): string }; scorePrev24h: number },
  secondLatest: { score: { toString(): string } } | undefined,
): number {
  if (latest.scorePrev24h !== 0) {
    return clampScore(latest.scorePrev24h);
  }
  if (secondLatest) {
    return clampScore(Number(secondLatest.score));
  }
  return clampScore(Number(latest.score));
}

function toRank(row: NarrativeSnapshot): RotationRank {
  return {
    slug: row.slug,
    name: row.name,
    delta: row.delta,
    score: row.score,
  };
}

/** GET /api/v1/attention/rotation — narrative attention flow (gainers vs losers). */
export async function GET() {
  try {
    const rows = await prisma.attentionScore.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        narrative: true,
        narrativeSlug: true,
        narrativeName: true,
        score: true,
        scorePrev24h: true,
        updatedAt: true,
      },
    });

    const bySlug = new Map<string, typeof rows>();
    for (const row of rows) {
      const slug = slugKey(row.narrativeSlug, row.narrative);
      const bucket = bySlug.get(slug) ?? [];
      bucket.push(row);
      bySlug.set(slug, bucket);
    }

    if (bySlug.size < 2) {
      const empty: AttentionRotationPayload = { flows: [], gainers: [], losers: [] };
      return NextResponse.json(ok(empty), {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    const snapshots: NarrativeSnapshot[] = [];

    for (const [slug, slugRows] of bySlug) {
      const sorted = [...slugRows].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      );
      const latest = sorted[0]!;
      const secondLatest = sorted[1];

      const score = clampScore(Number(latest.score));
      const prev24hScore = resolvePrev24hScore(latest, secondLatest);
      const delta = Number((score - prev24hScore).toFixed(2));

      snapshots.push({
        slug,
        name: displayName(latest.narrativeName, latest.narrative),
        score,
        prev24hScore,
        delta,
        classification: classify(delta),
      });
    }

    const gainers = snapshots
      .filter((s) => s.classification === "gaining")
      .sort((a, b) => b.delta - a.delta)
      .map(toRank);

    const losers = snapshots
      .filter((s) => s.classification === "losing")
      .sort((a, b) => a.delta - b.delta)
      .map(toRank);

    const topGainers = gainers.slice(0, 3);
    const topLosers = losers.slice(0, 3);
    const pairCount = Math.min(topGainers.length, topLosers.length);

    const flows: RotationFlow[] = [];
    for (let i = 0; i < pairCount; i++) {
      const loser = topLosers[i]!;
      const gainer = topGainers[i]!;
      flows.push({
        from: loser.slug,
        fromName: loser.name,
        to: gainer.slug,
        toName: gainer.name,
        magnitude: Math.abs(loser.delta),
        fromScore: loser.score,
        toScore: gainer.score,
      });
    }

    const payload: AttentionRotationPayload = { flows, gainers, losers };

    return NextResponse.json(ok(payload), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("ATTENTION_ROTATION_UNAVAILABLE", message), { status: 503 });
  }
}
