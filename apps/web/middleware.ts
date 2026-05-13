import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/server/admin/admin-session-constants";
import { verifyAdminSessionTokenEdge } from "@/server/admin/admin-jwt-edge";

/**
 * Operator console — JWT cookie must be present and valid before hitting
 * dashboard routes (UI still performs API checks).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const needsOperatorSession =
    pathname === "/admin" ||
    pathname === "/admin/dashboard" ||
    pathname.startsWith("/admin/dashboard/");

  if (!needsOperatorSession) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !(await verifyAdminSessionTokenEdge(token))) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
