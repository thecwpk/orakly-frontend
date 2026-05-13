import { jwtVerify } from "jose";

const OPERATOR_ROLES = new Set<string>(["ADMIN", "MODERATOR"]);

/**
 * Verify HS256 admin session JWT without Node `jsonwebtoken` (Edge / middleware).
 */
export async function verifyAdminSessionTokenEdge(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 16) return false;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    const role = typeof payload.role === "string" ? payload.role : "";
    return OPERATOR_ROLES.has(role);
  } catch {
    return false;
  }
}
