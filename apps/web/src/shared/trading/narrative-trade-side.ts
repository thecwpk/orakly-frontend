/** Backend narrative conviction — Express `POST /trade` and BFF trade routes. */
export type NarrativeTradeSide = "FOR" | "AGAINST";

/** UI order-book / modal labels (display only). */
export type UiTradeOutcome = "YES" | "NO";

export type UiTradeDirection = "BUY" | "SELL";

/** YES BUY → FOR · NO BUY → AGAINST */
export function uiOutcomeToNarrativeSide(
  outcome: UiTradeOutcome,
): NarrativeTradeSide {
  return outcome === "YES" ? "FOR" : "AGAINST";
}

export function narrativeSideToUiOutcome(
  side: NarrativeTradeSide,
): UiTradeOutcome {
  return side === "FOR" ? "YES" : "NO";
}

/** Wire params for trade + quote APIs (`side` is canonical; not YES/NO). */
export function toTradeApiSide(
  outcome: UiTradeOutcome,
  _direction: UiTradeDirection,
): NarrativeTradeSide {
  return uiOutcomeToNarrativeSide(outcome);
}

export function narrativeSideToExecutionOutcome(
  side: NarrativeTradeSide,
): UiTradeOutcome {
  return narrativeSideToUiOutcome(side);
}
