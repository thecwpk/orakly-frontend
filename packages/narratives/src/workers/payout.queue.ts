type PayoutJobQueue = {
  add(
    name: string,
    data: { marketId: string },
    opts?: Record<string, unknown>,
  ): Promise<unknown>;
};

let payoutQueue: PayoutJobQueue | null = null;

async function getQueue(): Promise<PayoutJobQueue | null> {
  if (payoutQueue) return payoutQueue;
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  try {
    const { Queue } = await import("bullmq");
    payoutQueue = new Queue("market-payout", {
      connection: { url, maxRetriesPerRequest: null },
    });
    return payoutQueue;
  } catch {
    return null;
  }
}

export async function enqueueMarketPayout(marketId: string): Promise<void> {
  const q = await getQueue();
  if (!q) {
    const { processMarketPayout } = await import("./payout.worker.js");
    await processMarketPayout(marketId);
    return;
  }

  await q.add(
    "payout",
    { marketId },
    {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 3_000 },
    },
  );
}
