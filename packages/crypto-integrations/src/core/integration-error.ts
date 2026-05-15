export class CryptoIntegrationError extends Error {
  readonly provider: string;
  readonly status?: number;
  readonly retryable: boolean;
  override readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      provider: string;
      status?: number;
      retryable?: boolean;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "CryptoIntegrationError";
    this.provider = options.provider;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}
