const BASE = "/api/v1/admin";

/** Client-only: skip `/admin/me` when no operator cookie (avoids noisy 401 in DevTools). */
export const ADMIN_SESSION_COOKIE = "orakly_admin_session";

export function hasAdminSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${ADMIN_SESSION_COOKIE}=`));
}

/** Shared with `AuthBridge` so operator session stays one React Query cache entry. */
export const adminMeQueryKey = ["admin", "me"] as const;

export class AdminApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

export async function adminApi<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers);
  let body: BodyInit | undefined = init?.body as BodyInit | undefined;
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }

  const fetchInit: RequestInit = init ? { ...init } : {};
  delete (fetchInit as RequestInit & { json?: unknown }).json;

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...fetchInit,
    headers,
    body,
  });

  const payload = (await res.json()) as {
    ok: boolean;
    data?: T;
    error?: { message?: string };
  };

  if (!payload.ok) {
    throw new AdminApiError(payload.error?.message ?? "Request failed", res.status);
  }
  return payload.data as T;
}

export async function adminLogin(apiToken: string, actorUserId: string) {
  return adminApi<{ expiresInSec: number }>("/session", {
    method: "POST",
    headers: { "x-admin-api-token": apiToken },
    json: { actorUserId },
  });
}

export async function adminLogout() {
  return adminApi<{ signedOut: boolean }>("/session", { method: "DELETE" });
}

/** Operator session from an existing signed-in ADMIN / MODERATOR wallet. */
export async function adminBootstrapFromWallet() {
  return adminApi<{ bootstrapped: boolean }>("/session/from-wallet", {
    method: "POST",
  });
}

export type AdminMe = {
  userId: string;
  adminId: string;
  role: string;
  email: string | null;
  displayName: string | null;
  permissions: string[];
};

export async function fetchAdminMe() {
  return adminApi<AdminMe>("/me");
}
