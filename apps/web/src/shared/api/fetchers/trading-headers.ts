/** Browser sends `x-trading-user-id` for custodial demo / dev sessions. */
export function tradingActorHeaders(): HeadersInit {
  const id =
    typeof window !== "undefined" ?
      process.env.NEXT_PUBLIC_TRADING_USER_ID?.trim()
    : undefined;
  if (!id) return {};
  return { "x-trading-user-id": id };
}

export function tradingActorId(): string | undefined {
  return typeof window !== "undefined" ?
      process.env.NEXT_PUBLIC_TRADING_USER_ID?.trim() || undefined
    : undefined;
}
