/** Room keys — used by Socket.IO `join` / `to`. */
export function marketRoom(marketId: string): string {
  return `market:${marketId}`;
}

export function globalFeedRoom(): string {
  return "feed:global";
}

export function userPortfolioRoom(userId: string): string {
  return `user:${userId}`;
}
