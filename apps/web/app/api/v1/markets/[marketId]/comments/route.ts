import { NextResponse } from "next/server";
import { prisma } from "@orakly/database";
import {
  createMarketComment,
  listMarketComments,
} from "@/server/queries/market-comments";
import { resolveWalletSessionFromCookies } from "@/server/wallet-auth/resolve-wallet-session";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { err, ok } from "../../../_lib/response";

type RouteCtx = { params: Promise<{ marketId: string }> };

/** GET /api/v1/markets/:id/comments — public discussion thread. */
export async function GET(req: Request, ctx: RouteCtx) {
  const { marketId } = await ctx.params;
  const takeRaw = Number.parseInt(
    new URL(req.url).searchParams.get("take") ?? "50",
    10,
  );
  const take = Number.isFinite(takeRaw) ? takeRaw : 50;

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true },
  });
  if (!market) {
    return NextResponse.json(err(API_ERROR_CODES.NOT_FOUND, "Market not found"), {
      status: 404,
    });
  }

  try {
    const data = await listMarketComments(marketId, take);
    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("COMMENTS_UNAVAILABLE", message), { status: 503 });
  }
}

/** POST /api/v1/markets/:id/comments — requires wallet session. */
export async function POST(req: Request, ctx: RouteCtx) {
  const session = await resolveWalletSessionFromCookies();
  if (!session?.address) {
    return NextResponse.json(
      err(API_ERROR_CODES.UNAUTHORIZED, "Wallet sign-in required"),
      { status: 401 },
    );
  }

  const { marketId } = await ctx.params;
  let bodyText = "";
  try {
    const json = (await req.json()) as { body?: string };
    bodyText = typeof json.body === "string" ? json.body : "";
  } catch {
    return NextResponse.json(err(API_ERROR_CODES.VALIDATION, "Invalid JSON"), {
      status: 400,
    });
  }

  let userId = session.userId;
  if (!userId) {
    const user = await prisma.user.findFirst({
      where: {
        walletAddress: { equals: session.address, mode: "insensitive" },
      },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json(
      err(API_ERROR_CODES.UNAUTHORIZED, "Link a wallet profile to comment"),
      { status: 401 },
    );
  }

  try {
    const comment = await createMarketComment({
      marketId,
      userId,
      body: bodyText,
    });
    return NextResponse.json(ok(comment), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message === "MARKET_NOT_FOUND") {
      return NextResponse.json(err(API_ERROR_CODES.NOT_FOUND, "Market not found"), {
        status: 404,
      });
    }
    if (message === "EMPTY_BODY") {
      return NextResponse.json(err(API_ERROR_CODES.VALIDATION, "Comment is empty"), {
        status: 400,
      });
    }
    if (message === "BODY_TOO_LONG") {
      return NextResponse.json(
        err(API_ERROR_CODES.VALIDATION, "Comment is too long"),
        { status: 400 },
      );
    }
    return NextResponse.json(err("COMMENTS_UNAVAILABLE", message), { status: 503 });
  }
}
