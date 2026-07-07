import { prisma } from "@orakly/database";
import {
  MarketDraftStatus,
  MarketStatus,
  MarketSuggestionStatus,
} from "@prisma/client";

export class MarketDraftError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "MarketDraftError";
    this.code = code;
    this.status = status;
  }
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${Date.now().toString(36)}`;
}

export async function promoteSuggestionToDraft(suggestionId: string) {
  return prisma.$transaction(async (tx) => {
    const suggestion = await tx.marketSuggestion.findUnique({
      where: { id: suggestionId },
      include: { draft: true },
    });

    if (!suggestion) {
      throw new MarketDraftError("NOT_FOUND", "Suggestion not found", 404);
    }
    if (suggestion.draft) {
      return suggestion.draft;
    }
    if (
      suggestion.status !== MarketSuggestionStatus.PENDING &&
      suggestion.status !== MarketSuggestionStatus.IN_REVIEW
    ) {
      throw new MarketDraftError(
        "INVALID_STATUS",
        `Suggestion is ${suggestion.status}`,
      );
    }

    const draft = await tx.marketDraft.create({
      data: {
        suggestionId: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        narrative: suggestion.narrative,
        status: MarketDraftStatus.IN_REVIEW,
      },
    });

    await tx.marketSuggestion.update({
      where: { id: suggestion.id },
      data: { status: MarketSuggestionStatus.IN_REVIEW },
    });

    return draft;
  });
}

export async function listMarketDrafts(status?: MarketDraftStatus) {
  return prisma.marketDraft.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { suggestion: true },
  });
}

export type PublishMarketDraftInput = {
  draftId: string;
  endDate: Date;
  resolutionSource: string;
  adminUserId?: string;
};

export async function publishMarketDraft(input: PublishMarketDraftInput) {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.marketDraft.findUnique({
      where: { id: input.draftId },
      include: { suggestion: true },
    });

    if (!draft) {
      throw new MarketDraftError("NOT_FOUND", "Draft not found", 404);
    }
    if (draft.status !== MarketDraftStatus.IN_REVIEW) {
      throw new MarketDraftError("INVALID_STATUS", `Draft is ${draft.status}`);
    }
    if (draft.marketId) {
      throw new MarketDraftError("ALREADY_PUBLISHED", "Draft already published");
    }

    const category = await tx.category.findFirst({
      where: {
        OR: [
          { slug: draft.category.toLowerCase() },
          { name: draft.category },
        ],
      },
    });

    const market = await tx.market.create({
      data: {
        slug: slugify(draft.title),
        title: draft.title,
        description:
          draft.description ??
          `Narrative market for ${draft.narrative ?? draft.category}`,
        categoryId: category?.id ?? null,
        creatorId: draft.suggestion?.submitterId ?? input.adminUserId ?? null,
        status: MarketStatus.OPEN,
        opensAt: new Date(),
        closesAt: input.endDate,
        yesPrice: 0.5,
        noPrice: 0.5,
        resolutionReason: input.resolutionSource,
        generationMeta: {
          resolutionSource: input.resolutionSource,
          sourceSuggestionId: draft.suggestionId,
          sourceDraftId: draft.id,
          narrative: draft.narrative,
        },
      },
    });

    await tx.marketDraft.update({
      where: { id: draft.id },
      data: {
        status: MarketDraftStatus.PUBLISHED,
        marketId: market.id,
        closesAt: input.endDate,
        resolutionSource: input.resolutionSource,
        reviewedById: input.adminUserId ?? null,
        reviewedAt: new Date(),
      },
    });

    await tx.marketSuggestion.update({
      where: { id: draft.suggestionId },
      data: {
        status: MarketSuggestionStatus.APPROVED,
        marketId: market.id,
      },
    });

    return {
      marketId: market.id,
      draftId: draft.id,
      suggestionId: draft.suggestionId,
      title: market.title,
      status: "LIVE",
      endDate: input.endDate.toISOString(),
      resolutionSource: input.resolutionSource,
    };
  });
}

export async function rejectMarketDraft(input: {
  draftId: string;
  reason: string;
  adminUserId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.marketDraft.findUnique({
      where: { id: input.draftId },
    });
    if (!draft) {
      throw new MarketDraftError("NOT_FOUND", "Draft not found", 404);
    }
    if (draft.status !== MarketDraftStatus.IN_REVIEW) {
      throw new MarketDraftError("INVALID_STATUS", `Draft is ${draft.status}`);
    }

    await tx.marketDraft.update({
      where: { id: draft.id },
      data: {
        status: MarketDraftStatus.REJECTED,
        rejectionReason: input.reason,
        reviewedById: input.adminUserId ?? null,
        reviewedAt: new Date(),
      },
    });

    await tx.marketSuggestion.update({
      where: { id: draft.suggestionId },
      data: { status: MarketSuggestionStatus.REJECTED },
    });

    return { draftId: draft.id, status: "REJECTED" };
  });
}
