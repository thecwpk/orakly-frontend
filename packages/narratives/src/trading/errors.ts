export class MarketTradeError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfterMs?: number;

  constructor(
    code: string,
    message: string,
    status = 400,
    retryAfterMs?: number,
  ) {
    super(message);
    this.name = "MarketTradeError";
    this.code = code;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}
