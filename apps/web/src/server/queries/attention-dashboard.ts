import { prisma } from "@orakly/database";
import type { AttentionNarrativeRow } from "@/shared/contracts/hub-home";

function momentumPct(score: number, previous: number | null): number {
  if (previous == null || previous <= 0) return 0;
  return Number((((score - previous) / previous) * 100).toFixed(2));
}

export async function getAttentionDashboardRows(): Promise<AttentionNarrativeRow[]> {
  const rows = await prisma.attentionScore.findMany({
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
  });

  if (rows.length === 0) {
    return [];
  }

  return rows.map((r) => {
    const score = Number(r.score);
    const previous = r.previousScore != null ? Number(r.previousScore) : null;
    return {
      narrative: r.narrative,
      score,
      trend: r.trend,
      momentumPct: momentumPct(score, previous),
      previousScore: previous,
    };
  });
}
