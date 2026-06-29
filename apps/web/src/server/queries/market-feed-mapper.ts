import type { Market } from "@orakly/types";
import type { MarketStatus as PrismaMarketStatus, Prisma, ResolutionStatus } from "@prisma/client";

type FeedRow = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  volumeTotalUsd: Prisma.Decimal;
  liquidityUsd: Prisma.Decimal;
  yesPrice: Prisma.Decimal | null;
  closesAt: Date | null;
  status: PrismaMarketStatus;
  resolutionStatus?: ResolutionStatus;
  resolutionReason?: string | null;
  resolvedOutcome?: string | null;
  generationMeta?: Prisma.JsonValue | null;
  category: { name: string } | null;
  creator?: { displayName: string | null; walletAddress: string | null } | null;
};

export function prismaMarketToFeedDto(m: FeedRow): Market {
  const yes = m.yesPrice ? Number(m.yesPrice) : 0.5;
  const prob = Number.isFinite(yes) ? Math.min(0.99, Math.max(0.01, yes)) : 0.5;

  let status: Market["status"] = "CLOSED";
  if (m.status === "OPEN") status = "OPEN";
  else if (m.status === "RESOLVED") status = "RESOLVED";

  const creatorDisplayName =
    m.creator?.displayName?.trim() ||
    (m.creator?.walletAddress
      ? `${m.creator.walletAddress.slice(0, 6)}…${m.creator.walletAddress.slice(-4)}`
      : null);

  return {
    id: m.id,
    backendMarketId: m.id,
    slug: m.slug,
    title: m.title,
    category: m.category?.name ?? "General",
    volumeUsd: Number(m.volumeTotalUsd),
    liquidityUsd: Number(m.liquidityUsd),
    probability: prob,
    closesAt: m.closesAt?.toISOString() ?? new Date().toISOString(),
    status,
    description: m.description,
    resolutionReason: m.resolutionReason,
    resolutionStatus: m.resolutionStatus,
    resolvedOutcome: m.resolvedOutcome ?? undefined,
    generationMeta:
      m.generationMeta && typeof m.generationMeta === "object" && !Array.isArray(m.generationMeta)
        ? (m.generationMeta as Record<string, unknown>)
        : null,
    creatorDisplayName,
  };
}
