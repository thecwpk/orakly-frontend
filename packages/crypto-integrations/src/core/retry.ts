export type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Retry when predicate returns true (e.g. 429 / 5xx). */
  retryIf?: (error: unknown, attempt: number) => boolean;
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Generic retry wrapper — used by the HTTP client and optional adapter-level recovery.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastError = e;
      const retry =
        attempt < options.maxAttempts &&
        (options.retryIf?.(e, attempt) ?? defaultRetryIf(e));
      if (!retry) throw e;
      const backoff = Math.min(
        options.maxDelayMs,
        options.baseDelayMs * 2 ** (attempt - 1),
      );
      await sleep(backoff);
    }
  }
  throw lastError;
}

function defaultRetryIf(error: unknown): boolean {
  if (error instanceof Error && error.name === "AbortError") return true;
  if (typeof error === "object" && error !== null && "status" in error) {
    const s = (error as { status?: number }).status;
    if (typeof s === "number") {
      if (s === 429) return true;
      if (s >= 500 && s <= 599) return true;
    }
  }
  return false;
}
