import {
  buildCategorizedCryptoFeed,
  chunkArray,
} from "@orakly/crypto-integrations";
import { prisma } from "@orakly/database";
import {
  ActivityType,
  IngestionRunStatus,
  MarketStatus,
  Prisma,
} from "@prisma/client";
import { getCryptoIntegrationsConfig } from "./crypto-config";
import {
  computeExternalMomentumScore,
  syncOpenMarketDiscoveryFromSignals,
} from "./discovery-metrics";
import {
  ensureCryptoCategoryTree,
  pickCategoryId,
  resolveAutoCategorySlug,
} from "./category-registry";
import { generateAutoMarketDraft } from "./market-generation-engine";
import { computeScoresForBatch, type ScoredCryptoAsset } from "./scoring";

function envNum(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function defaultIdempotencyKey(): string {
  const hour = new Date();
  hour.setMinutes(0, 0, 0);
  return `crypto-ingest:${hour.toISOString().slice(0, 13)}`;
}

function toDec(n: number | null | undefined, digits = 12): Prisma.Decimal | null {
  if (n == null || !Number.isFinite(n)) return null;
  return new Prisma.Decimal(n.toFixed(digits));
}

function toDecScore(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n.toFixed(8));
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

function activityPayload(asset: ScoredCryptoAsset): Prisma.InputJsonValue {
  return {
    dedupeKey: asset.dedupeKey,
    providers: asset.providers,
    primaryBucket: asset.primaryBucket,
    categoryScores: asset.categoryScores,
    fetchedAt: asset.fetchedAt,
  };
}

async function allocateSlug(
  tx: Prisma.TransactionClient,
  slugBase: string,
): Promise<string> {
  let slug = slugBase.slice(0, 200);
  for (let i = 0; i < 51; i += 1) {
    const clash = await tx.market.findUnique({ where: { slug } });
    if (!clash) return slug;
    slug = `${slugBase}-${i + 1}`.slice(0, 200);
  }
  return `${slugBase}-${Date.now()}`.slice(0, 200);
}

export type CryptoIngestionResult = {
  runId: string;
  status: "COMPLETED" | "SKIPPED" | "FAILED";
  stats?: Record<string, unknown>;
  error?: string;
};

/**
 * Queue-safe ingestion: deterministic `idempotencyKey` skips completed runs.
 * Chunked Prisma transactions for signal upserts + draft market creation.
 */
export async function runCryptoIngestionPipeline(
  options: { idempotencyKey?: string } = {},
): Promise<CryptoIngestionResult> {
  const idempotencyKey = options.idempotencyKey ?? defaultIdempotencyKey();
  const minHot = envNum("CRYPTO_INGEST_MIN_HOT_SCORE", 42);
  const maxMarkets = envNum("CRYPTO_INGEST_MAX_MARKETS", 15);
  const chunkSize = envNum("CRYPTO_INGEST_CHUNK_SIZE", 25);

  let run = await prisma.cryptoIngestionRun.findUnique({
    where: { idempotencyKey },
  });

  if (run?.status === IngestionRunStatus.COMPLETED) {
    return {
      runId: run.id,
      status: "SKIPPED",
      stats: (run.stats as Record<string, unknown>) ?? undefined,
    };
  }

  if (!run) {
    try {
      run = await prisma.cryptoIngestionRun.create({
        data: {
          idempotencyKey,
          status: IngestionRunStatus.PENDING,
        },
      });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      run = await prisma.cryptoIngestionRun.findUnique({
        where: { idempotencyKey },
      });
      if (!run) throw e;
      if (run.status === IngestionRunStatus.COMPLETED) {
        return {
          runId: run.id,
          status: "SKIPPED",
          stats: (run.stats as Record<string, unknown>) ?? undefined,
        };
      }
    }
  }

  const runId = run.id;

  await prisma.cryptoIngestionRun.update({
    where: { id: runId },
    data: {
      status: IngestionRunStatus.RUNNING,
      startedAt: new Date(),
      errorMessage: null,
    },
  });

  try {
    const feed = await buildCategorizedCryptoFeed(getCryptoIntegrationsConfig());
    const scored = computeScoresForBatch(feed.mergedAssets);
    const now = new Date();

    await prisma.$transaction(
      async (tx) => {
        for (const chunk of chunkArray(scored, chunkSize)) {
          await Promise.all(
            chunk.map((row) =>
              tx.cryptoTokenSignal.upsert({
                where: { dedupeKey: row.dedupeKey },
                create: {
                  ingestionRunId: runId,
                  dedupeKey: row.dedupeKey,
                  chainId: row.chainId,
                  tokenAddress: row.tokenAddress,
                  coingeckoId: row.coingeckoId,
                  symbol: row.symbol,
                  name: row.name,
                  priceUsd: toDec(row.priceUsd, 12),
                  liquidityUsd: toDec(row.liquidityUsd, 8),
                  volume24hUsd: toDec(row.volume24hUsd, 8),
                  fdvUsd: toDec(row.fdvUsd, 8),
                  change24hPct: toDec(row.change24hPct, 8),
                  pairCreatedAt:
                    row.pairCreatedAtMs != null
                      ? new Date(row.pairCreatedAtMs)
                      : null,
                  imageUrl: row.imageUrl,
                  pairAddress: row.pairAddress,
                  dexId: row.dexId,
                  providers: [...row.providers],
                  categoryScores: row.categoryScores as Prisma.InputJsonValue,
                  hotScore: toDecScore(row.hotScore),
                  volatilityScore: toDecScore(row.volatilityScore),
                  volumeScore: toDecScore(row.volumeScore),
                  memeScore: toDecScore(row.memeScore),
                  primaryBucket: row.primaryBucket,
                  activitySnapshot: activityPayload(row),
                  lastSeenAt: now,
                  firstSeenAt: now,
                },
                update: {
                  ingestionRunId: runId,
                  chainId: row.chainId,
                  tokenAddress: row.tokenAddress,
                  coingeckoId: row.coingeckoId,
                  symbol: row.symbol,
                  name: row.name,
                  priceUsd: toDec(row.priceUsd, 12),
                  liquidityUsd: toDec(row.liquidityUsd, 8),
                  volume24hUsd: toDec(row.volume24hUsd, 8),
                  fdvUsd: toDec(row.fdvUsd, 8),
                  change24hPct: toDec(row.change24hPct, 8),
                  pairCreatedAt:
                    row.pairCreatedAtMs != null
                      ? new Date(row.pairCreatedAtMs)
                      : null,
                  imageUrl: row.imageUrl,
                  pairAddress: row.pairAddress,
                  dexId: row.dexId,
                  providers: [...row.providers],
                  categoryScores: row.categoryScores as Prisma.InputJsonValue,
                  hotScore: toDecScore(row.hotScore),
                  volatilityScore: toDecScore(row.volatilityScore),
                  volumeScore: toDecScore(row.volumeScore),
                  memeScore: toDecScore(row.memeScore),
                  primaryBucket: row.primaryBucket,
                  activitySnapshot: activityPayload(row),
                  lastSeenAt: now,
                },
              }),
            ),
          );
        }
      },
      { maxWait: 15_000, timeout: 120_000 },
    );

    const discoverySynced = await syncOpenMarketDiscoveryFromSignals(
      prisma,
      now,
    );

    const marketsCreated = await prisma.$transaction(
      async (tx) => {
        const { slugToId } = await ensureCryptoCategoryTree(tx);

        const candidates = await tx.cryptoTokenSignal.findMany({
          where: {
            hotScore: { gte: new Prisma.Decimal(minHot.toFixed(8)) },
            markets: { none: {} },
          },
          orderBy: [{ hotScore: "desc" }, { lastSeenAt: "desc" }],
          take: maxMarkets,
        });

        let created = 0;

        for (const signal of candidates) {
          const seed = {
            dedupeKey: signal.dedupeKey,
            symbol: signal.symbol,
            name: signal.name,
            primaryBucket: signal.primaryBucket as ScoredCryptoAsset["primaryBucket"],
            hotScore: Number(signal.hotScore),
            volatilityScore: Number(signal.volatilityScore),
            volumeScore: Number(signal.volumeScore),
            memeScore: Number(signal.memeScore),
            volume24hUsd: signal.volume24hUsd?.toNumber() ?? null,
            liquidityUsd: signal.liquidityUsd?.toNumber() ?? null,
            change24hPct: signal.change24hPct?.toNumber() ?? null,
            priceUsd: signal.priceUsd?.toNumber() ?? null,
          };

          const categorySlug = resolveAutoCategorySlug(seed.primaryBucket);
          const categoryId = pickCategoryId(slugToId, seed.primaryBucket);

          const draft = generateAutoMarketDraft(seed, categorySlug, now);

          const dupByKey = await tx.market.findUnique({
            where: { generationKey: draft.generationKey },
          });
          if (dupByKey) continue;

          const slug = await allocateSlug(tx, draft.slugBase);

          const extMomentum = computeExternalMomentumScore(signal, now);

          const market = await tx.market.create({
            data: {
              slug,
              title: draft.title,
              description: draft.description,
              categoryId,
              status: MarketStatus.DRAFT,
              autoGenerated: true,
              cryptoSignalId: signal.id,
              generationKey: draft.generationKey,
              generationMeta: draft.generationMeta,
              closesAt: draft.closesAt,
              opensAt: draft.opensAt,
              yesPrice: draft.yesPrice,
              noPrice: draft.noPrice,
              volume24hUsd: draft.volume24hUsd,
              liquidityUsd: draft.liquidityUsd,
              trendingScore: draft.trendingScore,
              trendingUpdatedAt: now,
              signalProviderCount: signal.providers.length,
              signalHotScore: signal.hotScore,
              signalLastSeenAt: signal.lastSeenAt,
              externalMomentumScore: extMomentum,
            },
          });

          await tx.activity.create({
            data: {
              type: ActivityType.MARKET_CREATED,
              marketId: market.id,
              title: `Draft market · ${draft.title.slice(0, 120)}`,
              payload: {
                source: "crypto_ingestion",
                runId,
                dedupeKey: signal.dedupeKey,
                primaryBucket: signal.primaryBucket,
                templateId: draft.templateId,
                generationKey: draft.generationKey,
              },
            },
          });

          created += 1;
        }

        return created;
      },
      { maxWait: 15_000, timeout: 120_000 },
    );

    const stats = {
      signalsProcessed: scored.length,
      adapterErrors: feed.errors.length,
      draftMarketsCreated: marketsCreated,
      discoveryMarketsSynced: discoverySynced,
      buckets: Object.fromEntries(
        Object.entries(feed.byCategory).map(([k, v]) => [k, v.length]),
      ),
    };

    await prisma.cryptoIngestionRun.update({
      where: { id: runId },
      data: {
        status: IngestionRunStatus.COMPLETED,
        finishedAt: new Date(),
        stats,
      },
    });

    return { runId, status: "COMPLETED", stats };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await prisma.cryptoIngestionRun.update({
      where: { id: runId },
      data: {
        status: IngestionRunStatus.FAILED,
        finishedAt: new Date(),
        errorMessage: message.slice(0, 4000),
      },
    });
    return { runId, status: "FAILED", error: message };
  }
}
