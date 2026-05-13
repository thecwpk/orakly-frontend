import { parseAbi } from "viem";

/**
 * Expected on-chain events. If your deployed contract differs, update these
 * signatures so `decodeEventLog` matches; unknown selectors still persist as `UNKNOWN`.
 */
export const chainIndexerEventsAbi = parseAbi([
  "event TradeExecuted(uint256 indexed marketId, address indexed trader, uint256 shareAmount, uint256 collateralAmount)",
  "event MarketResolved(uint256 indexed marketId, uint8 winningOutcome)",
  "event RewardsClaimed(address indexed claimer, uint256 amount)",
  "event WalletDeposited(address indexed user, uint256 amount)",
]);
