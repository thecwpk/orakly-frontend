import { NextResponse } from "next/server";
import { prisma } from "@orakly/database";
import {
  createNarrativeComment,
  listNarrativeComments,
} from "@/server/queries/narrative-timeline";
import { resolveWalletSessionFromCookies } from "@/server/wallet-auth/resolve-wallet-session";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { err, ok } from "../../../_lib/response";

type RouteCtx = { params: Promise<{ slug: string }> };

/** GET /api/v1/narratives/:slug/comments */
export async function GET(req: Request, ctx: RouteCtx) {
  const { slug: raw } = await ctx.params;
  const slug = decodeURIComponent(raw).trim().toLowerCase();
  const takeRaw = Number.parseInt(
    new URL(req.url).searchParams.get("take") ?? "50",
    10,
  );

  try {
    const data = await listNarrativeComments(slug, takeRaw);
    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("COMMENTS_UNAVAILABLE", message), { status: 503 });
  }
}

/** POST /api/v1/narratives/:slug/comments */
export async function POST(req: Request, ctx: RouteCtx) {
  const session = await resolveWalletSessionFromCookies();
  if (!session?.address) {
    return NextResponse.json(
      err(API_ERROR_CODES.UNAUTHORIZED, "Wallet sign-in required"),
      { status: 401 },
    );
  }

  const { slug: raw } = await ctx.params;
  const slug = decodeURIComponent(raw).trim().toLowerCase();

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
    const comment = await createNarrativeComment({
      narrativeSlug: slug,
      userId,
      body: bodyText,
    });
    return NextResponse.json(ok(comment), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
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
