import type { ApiResult } from "@/api/types";

const defaultBase =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type HttpClientConfig = {
  baseUrl?: string;
  getToken?: () => string | undefined;
};

export function createHttpClient(config: HttpClientConfig = {}) {
  const baseUrl = config.baseUrl ?? defaultBase;

  async function request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<ApiResult<T>> {
    const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = new Headers(init?.headers);
    const token = config.getToken?.();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    try {
      const res = await fetch(url, { ...init, headers });
      const json = (await res.json()) as ApiResult<T>;
      return json;
    } catch {
      return {
        ok: false,
        error: { code: "NETWORK_ERROR", message: "Request failed" },
      };
    }
  }

  return { request };
}

export const apiClient = createHttpClient();
