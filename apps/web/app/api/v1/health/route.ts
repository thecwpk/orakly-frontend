import { NextResponse } from "next/server";
import { ok } from "../_lib/response";

export async function GET() {
  return NextResponse.json(ok({ status: "ok", ts: new Date().toISOString() }));
}
