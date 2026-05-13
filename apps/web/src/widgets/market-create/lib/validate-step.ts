import {
  basicsSchema,
  createMarketSchema,
  liquiditySchema,
  resolutionSchema,
  timelineSchema,
  type CreateMarketPayload,
} from "@/api/schemas/create-market";
import type { CreateMarketDraft } from "@/features/markets/store/use-create-market-store";
import type { WizardStepId } from "@/features/markets/store/use-create-market-store";

export type StepValidation =
  | { ok: true }
  | { ok: false; errors: Partial<Record<keyof CreateMarketDraft, string>> };

function flattenZodError(
  err: unknown,
): Partial<Record<keyof CreateMarketDraft, string>> {
  const out: Partial<Record<keyof CreateMarketDraft, string>> = {};
  const issues = (err as { issues?: { path: (string | number)[]; message: string }[] }).issues;
  if (!issues) return out;
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) {
      out[key as keyof CreateMarketDraft] = issue.message;
    }
  }
  return out;
}

export function validateStep(
  stepId: WizardStepId,
  draft: CreateMarketDraft,
): StepValidation {
  const draftWithCleanUrls = {
    ...draft,
    sourceUrl: draft.sourceUrl?.trim() ? draft.sourceUrl.trim() : undefined,
    opensAt: draft.opensAt?.trim() ? draft.opensAt.trim() : undefined,
  };

  switch (stepId) {
    case "basics": {
      const r = basicsSchema.safeParse(draft);
      return r.success ? { ok: true } : { ok: false, errors: flattenZodError(r.error) };
    }
    case "resolution": {
      const r = resolutionSchema.safeParse(draftWithCleanUrls);
      return r.success ? { ok: true } : { ok: false, errors: flattenZodError(r.error) };
    }
    case "timeline": {
      const r = timelineSchema.safeParse(draftWithCleanUrls);
      return r.success ? { ok: true } : { ok: false, errors: flattenZodError(r.error) };
    }
    case "liquidity": {
      const r = liquiditySchema.safeParse(draft);
      return r.success ? { ok: true } : { ok: false, errors: flattenZodError(r.error) };
    }
    case "preview": {
      const r = createMarketSchema.safeParse(draftWithCleanUrls);
      return r.success ? { ok: true } : { ok: false, errors: flattenZodError(r.error) };
    }
    default:
      return { ok: true };
  }
}

export function draftToPayload(draft: CreateMarketDraft): CreateMarketPayload {
  return createMarketSchema.parse({
    ...draft,
    sourceUrl: draft.sourceUrl?.trim() ? draft.sourceUrl.trim() : undefined,
    opensAt: draft.opensAt?.trim() ? draft.opensAt.trim() : undefined,
  });
}

export function suggestSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
