import { CryptoIntegrationError } from "./integration-error";
import { hitRateGuard } from "./rate-guard";
import { withRetry } from "./retry";

export type FetchJsonOptions = {
  timeoutMs?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
  /** When set, applies per-provider sliding-window guard before the request. */
  rateBucket?: string;
  rateLimitPerMinute?: number;
};

function parseRetryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const asInt = Number.parseInt(header, 10);
  if (!Number.isNaN(asInt)) return asInt * 1000;
  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) return Math.max(0, asDate - Date.now());
  return null;
}

function normalizeHeaders(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(h)) return Object.fromEntries(h);
  return { ...h };
}

export function createFetchJson(fetchImpl: typeof fetch) {
  return async function fetchJson<T>(
    url: string,
    provider: string,
    init?: RequestInit & FetchJsonOptions,
  ): Promise<T> {
    const {
      timeoutMs = 12_000,
      maxRetries = 3,
      headers,
      rateBucket,
      rateLimitPerMinute,
      ...fetchInit
    } = init ?? {};

    if (rateBucket !== undefined && rateLimitPerMinute !== undefined) {
      const g = hitRateGuard(rateBucket, rateLimitPerMinute);
      if (!g.ok) {
        throw new CryptoIntegrationError("Local rate guard tripped", {
          provider,
          retryable: true,
        });
      }
    }

    return withRetry(
      async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetchImpl(url, {
            ...fetchInit,
            signal: controller.signal,
            headers: {
              Accept: "application/json",
              ...normalizeHeaders(headers),
            },
          });

          if (!res.ok) {
            let detail = res.statusText;
            try {
              const text = await res.text();
              if (text) detail = text.slice(0, 400);
            } catch {
              /* ignore */
            }
            throw new CryptoIntegrationError(`HTTP ${res.status}: ${detail}`, {
              provider,
              status: res.status,
              retryable: res.status === 429 || (res.status >= 500 && res.status <= 599),
            });
          }

          return (await res.json()) as T;
        } finally {
          clearTimeout(timer);
        }
      },
      {
        maxAttempts: Math.max(1, maxRetries + 1),
        baseDelayMs: 280,
        maxDelayMs: 5_000,
        retryIf: (err, attempt) => {
          void attempt;
          if (err instanceof CryptoIntegrationError && err.retryable) return true;
          if (err instanceof Error && err.name === "AbortError") return true;
          return false;
        },
      },
    );
  };
}

export async function parseRetryAfterHeader(
  res: Response,
): Promise<number | null> {
  return parseRetryAfterMs(res.headers.get("retry-after"));
}
