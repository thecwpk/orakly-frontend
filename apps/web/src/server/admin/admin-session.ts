import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@orakly/database";
import { UserRole } from "@prisma/client";
import { ADMIN_SESSION_COOKIE } from "./admin-session-constants";

import { ensureStaffAdminRecord } from "@/server/admin/staff-provision";

export { ADMIN_SESSION_COOKIE } from "./admin-session-constants";

const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 8;

export type AdminPermission =
  | "markets.write"
  | "markets.resolve"
  | "markets.moderate"
  | "categories.manage"
  | "users.manage"
  | "analytics.read";

export type AdminActorContext = {
  userId: string;
  adminId: string;
  role: UserRole;
  email: string | null;
  displayName: string | null;
  permissions: Set<AdminPermission>;
};

export class AdminAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public httpStatus: number,
  ) {
    super(message);
  }
}

type JwtClaims = {
  sub: string;
  aid: string;
  role: UserRole;
};

function requireSessionSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new AdminAuthError(
      "CONFIG",
      "ADMIN_SESSION_SECRET is not configured (min 16 chars)",
      500,
    );
  }
  return s;
}

export function signAdminSessionToken(claims: JwtClaims, expiresInSec = 60 * 60 * 8): string {
  const secret = requireSessionSecret();
  return jwt.sign(claims, secret, { algorithm: "HS256", expiresIn: expiresInSec });
}

export function verifyAdminSessionToken(token: string): JwtClaims {
  const secret = requireSessionSecret();
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof decoded !== "object" || decoded === null) {
      throw new AdminAuthError("UNAUTHORIZED", "Invalid session", 401);
    }
    const sub = (decoded as jwt.JwtPayload).sub;
    const aid = (decoded as jwt.JwtPayload).aid;
    const role = (decoded as jwt.JwtPayload).role as UserRole;
    if (typeof sub !== "string" || typeof aid !== "string" || !role) {
      throw new AdminAuthError("UNAUTHORIZED", "Invalid session claims", 401);
    }
    return { sub, aid, role };
  } catch {
    throw new AdminAuthError("UNAUTHORIZED", "Session expired or invalid", 401);
  }
}

export function timingSafeEqualToken(provided: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(provided, "utf8").digest();
  const b = crypto.createHash("sha256").update(expected, "utf8").digest();
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function resolveBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization")?.trim();
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  const t = h.slice(7).trim();
  return t || null;
}

export function readAdminSessionToken(req: NextRequest): string | null {
  return resolveBearer(req) ?? req.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

function permissionSet(role: UserRole, admin: {
  canResolveMarkets: boolean;
  canAdjustWallets: boolean;
  canManageUsers: boolean;
}): Set<AdminPermission> {
  const p = new Set<AdminPermission>();
  if (role === UserRole.ADMIN) {
    for (const x of [
      "markets.write",
      "markets.resolve",
      "markets.moderate",
      "categories.manage",
      "users.manage",
      "analytics.read",
    ] as const) {
      p.add(x);
    }
    return p;
  }
  if (role === UserRole.MODERATOR) {
    p.add("analytics.read");
    if (admin.canResolveMarkets) {
      p.add("markets.resolve");
      p.add("markets.moderate");
    }
    if (admin.canManageUsers) p.add("users.manage");
    return p;
  }
  return p;
}

export function attachAdminSessionCookie(
  res: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } },
  token: string,
  maxAgeSec = ADMIN_SESSION_MAX_AGE_SEC,
): void {
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeSec,
  });
}

/** Mint operator JWT cookie when the linked user is ADMIN or MODERATOR. */
export async function tryAttachAdminSessionForUser(
  res: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } },
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return false;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
    return false;
  }

  const admin = await ensureStaffAdminRecord(user.id);
  const token = signAdminSessionToken({
    sub: user.id,
    aid: admin.id,
    role: user.role,
  });
  attachAdminSessionCookie(res, token);
  return true;
}

export function clearAdminSessionCookie(
  res: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } },
): void {
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function resolveAdminActor(req: NextRequest): Promise<AdminActorContext> {
  const raw = readAdminSessionToken(req);
  if (!raw) {
    throw new AdminAuthError("UNAUTHORIZED", "Admin session required", 401);
  }
  const claims = verifyAdminSessionToken(raw);

  const adminRow = await prisma.admin.findUnique({
    where: { id: claims.aid },
    include: { user: true },
  });

  if (!adminRow || adminRow.userId !== claims.sub) {
    throw new AdminAuthError("UNAUTHORIZED", "Admin session no longer valid", 401);
  }

  const user = adminRow.user;
  if (user.isSuspended) {
    throw new AdminAuthError("FORBIDDEN", "Account suspended", 403);
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
    throw new AdminAuthError("FORBIDDEN", "Not an operator account", 403);
  }

  return {
    userId: user.id,
    adminId: adminRow.id,
    role: user.role,
    email: user.email,
    displayName: user.displayName,
    permissions: permissionSet(user.role, adminRow),
  };
}

export async function requireAdminPermission(
  req: NextRequest,
  permission: AdminPermission,
): Promise<AdminActorContext> {
  const ctx = await resolveAdminActor(req);
  if (!ctx.permissions.has(permission)) {
    throw new AdminAuthError(
      "FORBIDDEN",
      `Missing permission: ${permission}`,
      403,
    );
  }
  return ctx;
}

/** Full ADMIN role only — used for platform-wide configuration changes. */
export async function requireAdminRole(req: NextRequest): Promise<AdminActorContext> {
  const ctx = await resolveAdminActor(req);
  if (ctx.role !== UserRole.ADMIN) {
    throw new AdminAuthError("FORBIDDEN", "Admin role required", 403);
  }
  return ctx;
}

export function requireBootstrapApiToken(req: NextRequest): void {
  const expected = process.env.ADMIN_API_TOKEN?.trim();
  if (!expected) {
    throw new AdminAuthError(
      "CONFIG",
      "ADMIN_API_TOKEN is not configured",
      500,
    );
  }
  const provided = req.headers.get("x-admin-api-token")?.trim();
  if (!provided || !timingSafeEqualToken(provided, expected)) {
    throw new AdminAuthError("UNAUTHORIZED", "Invalid bootstrap credentials", 401);
  }
}
