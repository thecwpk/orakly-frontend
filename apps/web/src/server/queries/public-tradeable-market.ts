import "server-only";

import { MarketStatus, Prisma } from "@prisma/client";

/**
 * Markets safe to show on public browse / hub / home for regular users.
 * Only admin-deployed, tradeable markets: OPEN + non-empty on-chain address.
 */
export const publicTradeableMarketWhere: Prisma.MarketWhereInput = {
  status: MarketStatus.OPEN,
  onChainAddress: { not: null },
  NOT: { onChainAddress: "" },
};

/** OPEN tradeable, or RESOLVED markets that were deployed (historical browse). */
export const publicVisibleMarketWhere: Prisma.MarketWhereInput = {
  OR: [
    publicTradeableMarketWhere,
    {
      status: MarketStatus.RESOLVED,
      onChainAddress: { not: null },
      NOT: { onChainAddress: "" },
    },
  ],
};

export function withPublicTradeable(
  extra?: Prisma.MarketWhereInput,
): Prisma.MarketWhereInput {
  return extra
    ? { AND: [publicTradeableMarketWhere, extra] }
    : publicTradeableMarketWhere;
}

export function withPublicVisible(
  extra?: Prisma.MarketWhereInput,
): Prisma.MarketWhereInput {
  return extra
    ? { AND: [publicVisibleMarketWhere, extra] }
    : publicVisibleMarketWhere;
}

/** Prisma SQL fragment: deployed open market. */
export const PUBLIC_TRADEABLE_SQL = Prisma.sql`
  m.status = 'OPEN'
  AND m."onChainAddress" IS NOT NULL
  AND m."onChainAddress" <> ''
`;

export function isPublicTradeableMarket(m: {
  status?: string | null;
  onChainAddress?: string | null;
}): boolean {
  return (
    m.status === MarketStatus.OPEN && Boolean(m.onChainAddress?.trim())
  );
}

/** Deployed OPEN or RESOLVED — safe for public detail / historical browse. */
export function isPublicVisibleMarket(m: {
  status?: string | null;
  onChainAddress?: string | null;
}): boolean {
  if (!m.onChainAddress?.trim()) return false;
  return (
    m.status === MarketStatus.OPEN || m.status === MarketStatus.RESOLVED
  );
}
