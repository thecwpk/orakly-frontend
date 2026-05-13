import { NextResponse } from "next/server";
import { AdminAuthError } from "@/server/admin/admin-session";
import { TradingError } from "@/server/trading/errors";
import { API_ERROR_CODES } from "../../_lib/errors";
import { err } from "../../_lib/response";

export function adminJsonError(e: unknown): NextResponse {
  if (e instanceof AdminAuthError) {
    return NextResponse.json(err(e.code, e.message), { status: e.httpStatus });
  }
  if (e instanceof TradingError) {
    return NextResponse.json(err(e.code, e.message), { status: e.httpStatus });
  }
  console.error("[admin]", e);
  return NextResponse.json(
    err(API_ERROR_CODES.INTERNAL, "Unexpected server error"),
    { status: 500 },
  );
}
