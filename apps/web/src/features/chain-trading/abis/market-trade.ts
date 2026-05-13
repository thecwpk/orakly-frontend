import { parseAbi } from "viem";

/**
 * Minimal ABI — swap for your deployed artifact (`pnpm prisma` / Foundry `out/*.json`).
 *
 * ```solidity
 * function buyOutcomeShares(uint256 marketId, uint8 outcome, uint256 shareAmount) external;
 * ```
 *
 * `outcome`: `0` = YES, `1` = NO (must match contract; adjust mapping in `lib/outcome.ts` if different).
 */
export const chainMarketTradeAbi = parseAbi([
  "function buyOutcomeShares(uint256 marketId, uint8 outcome, uint256 shareAmount) external",
]);
