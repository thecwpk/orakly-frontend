import type { ApiResult } from "@/api/types";

function backendBaseUrl(): string {
  const raw =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_ORAKLY_API_URL?.trim()
      : process.env.ORAKLY_API_URL?.trim() ??
        process.env.NEXT_PUBLIC_ORAKLY_API_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : "";
}

export async function backendRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const base = backendBaseUrl();
  if (!base) {
    return {
      ok: false,
      error: {
        code: "BACKEND_URL_MISSING",
        message: "NEXT_PUBLIC_ORAKLY_API_URL is not configured",
      },
    };
  }

  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);

  try {
    const res = await fetch(url, { ...init, headers });
    return (await res.json()) as ApiResult<T>;
  } catch (e) {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: e instanceof Error ? e.message : "Backend request failed",
      },
    };
  }
}
