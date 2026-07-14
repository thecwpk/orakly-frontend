export type CommunitySuggestionStatus = "pending" | "in_review" | "approved" | "rejected";

export type CommunitySuggestion = {
  id: string;
  question: string;
  title: string;
  description: string | null;
  category: string;
  narrative: string | null;
  status: CommunitySuggestionStatus | string;
  voteCount: number;
  voterAddresses: string[];
  votesUp: number;
  votesDown: number;
  creatorAddress: string | null;
  creatorRewardPercent: number;
  feesEarned: number;
  rejectionReason: string | null;
  resolutionSource: string | null;
  resolvesAt: string | null;
  submitterId: string | null;
  marketId: string | null;
  marketSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommunitySuggestionSort = "votes" | "newest";

export type CreateCommunitySuggestionInput = {
  question: string;
  category: string;
  description?: string;
  resolutionSource?: string;
  narrative?: string;
  resolvesAt?: string;
};

export type VoteCommunitySuggestionResult = {
  voteCount: number;
  hasVoted: boolean;
};
