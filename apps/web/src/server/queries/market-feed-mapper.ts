import type { Market } from "@orakly/types";
import type { MarketStatus as PrismaMarketStatus, Prisma } from "@prisma/client";

type FeedRow = {
  id: string;
  slug: string;
  title: string;
  volumeTotalUsd: Prisma.Decimal;
  liquidityUsd: Prisma.Decimal;
  yesPrice: Prisma.Decimal | null;
  closesAt: Date | null;
  status: PrismaMarketStatus;
  category: { name: string } | null;
};

export function prismaMarketToFeedDto(m: FeedRow): Market {
  const yes = m.yesPrice ? Number(m.yesPrice) : 0.5;
  const prob = Number.isFinite(yes) ? Math.min(0.99, Math.max(0.01, yes)) : 0.5;

  let status: Market["status"] = "CLOSED";
  if (m.status === "OPEN") status = "OPEN";
  else if (m.status === "RESOLVED") status = "RESOLVED";

  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    category: m.category?.name ?? "General",
    volumeUsd: Number(m.volumeTotalUsd),
    liquidityUsd: Number(m.liquidityUsd),
    probability: prob,
    closesAt: m.closesAt?.toISOString() ?? new Date().toISOString(),
    status,
  };
}
