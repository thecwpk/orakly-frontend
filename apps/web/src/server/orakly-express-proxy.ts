import type { NextRequest } from "next/server";

function expressBaseUrl(): string {
  const raw =
    process.env.ORAKLY_API_URL?.trim() ??
    process.env.NEXT_PUBLIC_ORAKLY_API_URL?.trim();
  if (!raw) {
    throw new Error("ORAKLY_API_URL is not configured");
  }
  return raw.replace(/\/$/, "");
}

export async function proxyToExpress(
  req: NextRequest,
  path: string,
  options?: {
    userId?: string;
    idempotencyKey?: string | null;
    method?: string;
    body?: unknown;
  },
): Promise<Response> {
  const base = expressBaseUrl();
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (options?.userId) {
    headers.set("x-trading-user-id", options.userId);
  }
  const idem =
    options?.idempotencyKey?.trim() ??
    req.headers.get("idempotency-key")?.trim();
  if (idem) {
    headers.set("idempotency-key", idem);
  }

  const method = options?.method ?? req.method;
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body =
      options?.body !== undefined
        ? JSON.stringify(options.body)
        : await req.text();
  }

  const upstream = await fetch(url, { method, headers, body });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      ...(upstream.headers.get("Retry-After")
        ? { "Retry-After": upstream.headers.get("Retry-After")! }
        : {}),
    },
  });
}
