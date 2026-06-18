import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { MarketSuggestionStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import { createMarketSchema } from "@/api/schemas/create-market";
import { resolveWalletSessionFromCookies } from "@/server/wallet-auth/resolve-wallet-session";
import { API_ERROR_CODES } from "../../_lib/errors";
import { err, ok } from "../../_lib/response";

/** POST /api/v1/markets/create — community suggestion (wallet auth required). */
export async function POST(req: NextRequest) {
  const session = await resolveWalletSessionFromCookies();
  if (!session?.userId) {
    return NextResponse.json(err(API_ERROR_CODES.UNAUTHORIZED, "Wallet sign-in required"), {
      status: 401,
    });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      err(API_ERROR_CODES.VALIDATION, "Body must be valid JSON."),
      { status: 400 },
    );
  }

  const parsed = createMarketSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      err(API_ERROR_CODES.VALIDATION, first?.message ?? "Invalid market submission."),
      { status: 400 },
    );
  }

  const data = parsed.data;
  const resolutionNote = [
    data.source,
    data.sourceUrl ? `URL: ${data.sourceUrl}` : "",
    data.resolverNote,
  ]
    .filter(Boolean)
    .join(" · ");

  const suggestion = await prisma.marketSuggestion.create({
    data: {
      title: data.title,
      description: data.description || null,
      category: data.category,
      narrative: data.category,
      submitterId: session.userId,
      status: MarketSuggestionStatus.PENDING,
      triggerReason: resolutionNote || "Community submission",
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  revalidateTag("hub-suggestions");
  revalidateTag("markets-feed");

  return NextResponse.json(
    ok({
      id: suggestion.id,
      title: suggestion.title,
      status: suggestion.status,
      createdAt: suggestion.createdAt.toISOString(),
      pending: true,
    }),
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  const rows = await prisma.marketSuggestion.findMany({
    where: { status: MarketSuggestionStatus.PENDING },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      createdAt: true,
    },
  });
  return NextResponse.json(ok(rows), { headers: { "Cache-Control": "no-store" } });
}
