import {
  MarketDraftError,
  promoteSuggestionToDraft,
  publishMarketDraft,
} from "./marketDraft.service.js";

export type ApproveMarketSuggestionInput = {
  suggestionId: string;
  endDate: Date;
  resolutionSource: string;
  adminUserId?: string;
};

export class MarketApprovalError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "MarketApprovalError";
    this.code = code;
    this.status = status;
  }
}

function mapDraftError(e: MarketDraftError): MarketApprovalError {
  return new MarketApprovalError(e.code, e.message, e.status);
}

/** Suggestion → draft (if needed) → published market. */
export async function approveMarketSuggestion(
  input: ApproveMarketSuggestionInput,
) {
  try {
    const draft = await promoteSuggestionToDraft(input.suggestionId);
    return publishMarketDraft({
      draftId: draft.id,
      endDate: input.endDate,
      resolutionSource: input.resolutionSource,
      adminUserId: input.adminUserId,
    });
  } catch (e) {
    if (e instanceof MarketDraftError) throw mapDraftError(e);
    throw e;
  }
}
