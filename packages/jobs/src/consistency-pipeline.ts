import {
  computeNarratives,
  recomputeLiveMarketProbabilities,
  recomputeTopActiveMarkets,
  runPayoutSafetyScan,
  runResolutionCycle,
} from "@orakly/narratives";

export async function runFullRecompute(): Promise<Record<string, unknown>> {
  const [probability, narratives, resolution, payouts, sync] =
    await Promise.allSettled([
      recomputeLiveMarketProbabilities(),
      computeNarratives(),
      runResolutionCycle(),
      runPayoutSafetyScan(),
      recomputeTopActiveMarkets(20),
    ]);

  return {
    probability: probability.status === "fulfilled" ? probability.value : null,
    narratives: narratives.status === "fulfilled" ? narratives.value : null,
    resolution: resolution.status === "fulfilled" ? resolution.value : null,
    payouts: payouts.status === "fulfilled" ? payouts.value : null,
    sync: sync.status === "fulfilled" ? sync.value : null,
  };
}
