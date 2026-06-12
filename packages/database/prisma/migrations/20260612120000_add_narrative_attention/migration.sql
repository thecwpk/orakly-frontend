-- CreateEnum
CREATE TYPE "NarrativeTrend" AS ENUM ('RISING', 'STABLE', 'COOLING');

-- CreateEnum
CREATE TYPE "MarketSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "attention_scores" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "narrative" VARCHAR(64) NOT NULL,
    "score" DECIMAL(8,4) NOT NULL,
    "trend" "NarrativeTrend" NOT NULL DEFAULT 'STABLE',
    "redditScore" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "newsScore" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "coingeckoMomentum" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "tvlGrowth" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "previousScore" DECIMAL(8,4),
    "rawSnapshot" JSONB,

    CONSTRAINT "attention_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_suggestions" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" VARCHAR(64) NOT NULL,
    "narrative" VARCHAR(64),
    "votesUp" INTEGER NOT NULL DEFAULT 0,
    "votesDown" INTEGER NOT NULL DEFAULT 0,
    "status" "MarketSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "triggerReason" TEXT,
    "marketId" UUID,

    CONSTRAINT "market_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_api_logs" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" VARCHAR(64) NOT NULL,
    "endpoint" VARCHAR(512) NOT NULL,
    "status" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "response_snippet" TEXT,
    "error" TEXT,

    CONSTRAINT "external_api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attention_scores_narrative_key" ON "attention_scores"("narrative");

-- CreateIndex
CREATE INDEX "attention_scores_score_idx" ON "attention_scores"("score" DESC);

-- CreateIndex
CREATE INDEX "attention_scores_updatedAt_idx" ON "attention_scores"("updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "market_suggestions_marketId_key" ON "market_suggestions"("marketId");

-- CreateIndex
CREATE INDEX "market_suggestions_status_createdAt_idx" ON "market_suggestions"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "market_suggestions_narrative_idx" ON "market_suggestions"("narrative");

-- CreateIndex
CREATE INDEX "external_api_logs_source_createdAt_idx" ON "external_api_logs"("source", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "market_suggestions" ADD CONSTRAINT "market_suggestions_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;
