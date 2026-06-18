import { parseAbi } from "viem";

/**
 * Indexer events from orakly-market contracts (Market + MarketFactory).
 * Run `node scripts/sync-contract-abis.mjs` after `forge build` for full artifacts.
 */
export const chainIndexerEventsAbi = parseAbi([
  "event MarketCreated(address indexed market, address indexed creator, string question, uint256 endTime, uint8 category, uint256 seedLiquidity, uint256 assertionReward)",
  "event BoughtYes(address indexed user, uint256 collateralIn, uint256 fee, uint256 yesOut)",
  "event BoughtNo(address indexed user, uint256 collateralIn, uint256 fee, uint256 noOut)",
  "event SoldYes(address indexed user, uint256 yesBurned, uint256 collateralOut, uint256 fee)",
  "event SoldNo(address indexed user, uint256 noBurned, uint256 collateralOut, uint256 fee)",
  "event MarketResolved(bytes32 assertedOutcomeId)",
  "event Settled(address indexed user, uint256 payout)",
]);
