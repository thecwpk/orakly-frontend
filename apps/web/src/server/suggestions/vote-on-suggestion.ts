import "server-only";

import { SuggestionVoteDirection } from "@prisma/client";
import { prisma } from "@orakly/database";

export type VoteSuggestionInput = {
  suggestionId: string;
  userId: string;
  direction: "UP" | "DOWN";
};

export async function voteOnMarketSuggestion(input: VoteSuggestionInput) {
  const direction =
    input.direction === "UP"
      ? SuggestionVoteDirection.UP
      : SuggestionVoteDirection.DOWN;

  return prisma.$transaction(async (tx) => {
    const suggestion = await tx.marketSuggestion.findUnique({
      where: { id: input.suggestionId },
      select: { id: true, votesUp: true, votesDown: true },
    });
    if (!suggestion) {
      throw new Error("SUGGESTION_NOT_FOUND");
    }

    const existing = await tx.marketSuggestionVote.findUnique({
      where: {
        suggestionId_userId: {
          suggestionId: input.suggestionId,
          userId: input.userId,
        },
      },
    });

    let votesUpDelta = 0;
    let votesDownDelta = 0;

    if (!existing) {
      if (direction === SuggestionVoteDirection.UP) votesUpDelta = 1;
      else votesDownDelta = 1;
      await tx.marketSuggestionVote.create({
        data: {
          suggestionId: input.suggestionId,
          userId: input.userId,
          direction,
        },
      });
    } else if (existing.direction === direction) {
      return tx.marketSuggestion.findUniqueOrThrow({
        where: { id: input.suggestionId },
        select: { id: true, votesUp: true, votesDown: true },
      });
    } else {
      if (direction === SuggestionVoteDirection.UP) {
        votesUpDelta = 1;
        votesDownDelta = -1;
      } else {
        votesUpDelta = -1;
        votesDownDelta = 1;
      }
      await tx.marketSuggestionVote.update({
        where: { id: existing.id },
        data: { direction },
      });
    }

    return tx.marketSuggestion.update({
      where: { id: input.suggestionId },
      data: {
        votesUp: { increment: votesUpDelta },
        votesDown: { increment: votesDownDelta },
      },
      select: { id: true, votesUp: true, votesDown: true },
    });
  });
}
