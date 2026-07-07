import { prisma } from "@orakly/database";
import { HTTP_MAX_RETRIES, HTTP_TIMEOUT_MS } from "./constants.js";

export type FetchJsonResult<T> = {
  data: T;
  status: number;
  durationMs: number;
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function isRetryable(status: number, err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") return true;
  return status === 429 || (status >= 500 && status <= 599);
}

async function logApiCall(input: {
  source: string;
  endpoint: string;
  status: number;
  durationMs: number;
  responseSnippet?: string;
  error?: string;
}): Promise<void> {
  try {
    await prisma.externalApiLog.create({
      data: {
        source: input.source,
        endpoint: input.endpoint.slice(0, 512),
        status: input.status,
        durationMs: input.durationMs,
        responseSnippet: input.responseSnippet?.slice(0, 2000) ?? null,
        error: input.error?.slice(0, 2000) ?? null,
      },
    });
  } catch (e) {
    console.warn("[narratives] failed to persist api log", e);
  }
}

export async function fetchJsonWithRetry<T>(
  url: string,
  source: string,
  init?: RequestInit,
): Promise<FetchJsonResult<T>> {
  let lastError: unknown;
  let lastStatus = 0;

  for (let attempt = 1; attempt <= HTTP_MAX_RETRIES; attempt++) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(init?.headers ?? {}),
        },
      });

      lastStatus = res.status;
      const durationMs = Date.now() - started;

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        await logApiCall({
          source,
          endpoint: url,
          status: res.status,
          durationMs,
          responseSnippet: text.slice(0, 400),
          error: `HTTP ${res.status}`,
        });

        if (attempt < HTTP_MAX_RETRIES && isRetryable(res.status, null)) {
          await sleep(280 * 2 ** (attempt - 1));
          continue;
        }

        throw new Error(`[${source}] HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = (await res.json()) as T;
      await logApiCall({
        source,
        endpoint: url,
        status: res.status,
        durationMs,
        responseSnippet: JSON.stringify(data).slice(0, 400),
      });

      return { data, status: res.status, durationMs };
    } catch (e) {
      lastError = e;
      const durationMs = Date.now() - started;
      await logApiCall({
        source,
        endpoint: url,
        status: lastStatus || 0,
        durationMs,
        error: e instanceof Error ? e.message : String(e),
      });

      if (attempt < HTTP_MAX_RETRIES && isRetryable(lastStatus, e)) {
        await sleep(280 * 2 ** (attempt - 1));
        continue;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}
