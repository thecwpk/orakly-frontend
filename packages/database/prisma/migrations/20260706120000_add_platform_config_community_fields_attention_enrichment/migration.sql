-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "attentionScore" DOUBLE PRECISION,
ADD COLUMN     "convictionScore" DOUBLE PRECISION,
ADD COLUMN     "creatorAddress" TEXT,
ADD COLUMN     "creatorRewardPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "momentum" TEXT NOT NULL DEFAULT 'Stable',
ADD COLUMN     "narrative" TEXT,
ADD COLUMN     "resolutionSource" TEXT;

-- AlterTable
ALTER TABLE "attention_scores" ADD COLUMN     "activeMarkets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "convictionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "liquidity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "momentum" TEXT NOT NULL DEFAULT 'Stable',
ADD COLUMN     "narrativeName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "narrativeSlug" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "openInterest" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "scorePrev24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "uniqueTraders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "volume24hUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "market_suggestions" ADD COLUMN     "creatorRewardPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "feesEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "voteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "voterAddresses" TEXT[];

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformConfig_key_key" ON "PlatformConfig"("key");

-- CreateIndex
CREATE INDEX "attention_scores_narrativeSlug_idx" ON "attention_scores"("narrativeSlug");
