import { NextResponse } from "next/server";
import { TradingError } from "@/server/trading/errors";
import { API_ERROR_CODES } from "./errors";
import { err } from "./response";

export function tradingJsonError(e: unknown): NextResponse {
  if (e instanceof TradingError) {
    return NextResponse.json(err(e.code, e.message), {
      status: e.httpStatus,
    });
  }

  console.error("[trading]", e);
  return NextResponse.json(
    err(API_ERROR_CODES.INTERNAL, "Unexpected server error"),
    { status: 500 },
  );
}
