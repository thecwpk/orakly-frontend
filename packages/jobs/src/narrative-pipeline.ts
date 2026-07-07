import {
  computeNarratives,
  generateMarketSuggestions,
  autoPublishNarrativeMarkets,
} from "@orakly/narratives";

export type NarrativePipelineResult = {
  status: "COMPLETED" | "FAILED";
  narrativesUpdated: number;
  suggestionsCreated: number;
  marketsPublished: number;
  error?: string;
};

let pipelineRunning = false;

export async function runNarrativeUpdatePipeline(): Promise<NarrativePipelineResult> {
  if (pipelineRunning) {
    return {
      status: "COMPLETED",
      narrativesUpdated: 0,
      suggestionsCreated: 0,
      marketsPublished: 0,
      error: "SKIPPED_DUPLICATE_RUN",
    };
  }

  pipelineRunning = true;
  try {
    const { narratives, volumeSpikes } = await computeNarratives();
    const suggestionsCreated = await generateMarketSuggestions({
      narratives,
      volumeSpikes,
    });
    const marketsPublished = await autoPublishNarrativeMarkets({
      narratives,
      volumeSpikes,
    });

    return {
      status: "COMPLETED",
      narrativesUpdated: narratives.length,
      suggestionsCreated,
      marketsPublished,
    };
  } catch (e) {
    return {
      status: "FAILED",
      narrativesUpdated: 0,
      suggestionsCreated: 0,
      marketsPublished: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    pipelineRunning = false;
  }
}
