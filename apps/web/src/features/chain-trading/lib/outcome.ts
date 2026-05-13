export type TradeOutcomeSide = "YES" | "NO";

/** Default mapping for `buyOutcomeShares`: 0 YES, 1 NO. */
export function outcomeToChainUint8(outcome: TradeOutcomeSide): 0 | 1 {
  return outcome === "YES" ? 0 : 1;
}
