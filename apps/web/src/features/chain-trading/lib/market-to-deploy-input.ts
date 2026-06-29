import type { DeployOnChainMarketInput } from "../hooks/use-deploy-on-chain-market";
import { categorySlugToChainCategory } from "./category-slug-to-chain-category";

/** Collateral pulled at deploy — capped so factory bootstrap stays affordable on testnet. */
const DEPLOY_SEED_USD = "100";

export type DeployableMarketRecord = {
  title: string;
  description?: string | null;
  closesAt: string | Date;
  takerFeeBps?: number | null;
  category?: { slug: string } | null;
};

export function marketRecordToDeployInput(
  market: DeployableMarketRecord,
): DeployOnChainMarketInput {
  const closes =
    market.closesAt instanceof Date
      ? market.closesAt
      : new Date(market.closesAt);
  const endTimeUnix = Math.floor(closes.getTime() / 1000);

  return {
    question: market.title.trim(),
    resolutionSource:
      market.description?.trim() ||
      "Resolves per the Orakly market listing resolution rules.",
    category: categorySlugToChainCategory(market.category?.slug),
    endTimeUnix,
    seedLiquidityUsd: DEPLOY_SEED_USD,
    assertionRewardUsd: "5",
    requiredBondUsd: "1",
    feeBps: Math.min(Math.max(market.takerFeeBps ?? 25, 0), 200),
  };
}
