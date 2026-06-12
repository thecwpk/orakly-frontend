-- MarketSuggestionStatus: add IN_REVIEW
ALTER TYPE "MarketSuggestionStatus" ADD VALUE IF NOT EXISTS 'IN_REVIEW';

-- MarketDraftStatus
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarketDraftStatus') THEN
    CREATE TYPE "MarketDraftStatus" AS ENUM ('IN_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED');
  END IF;
END $$;

-- LedgerEntry extensions
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "portfolio_id" UUID;
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "market_id" UUID;
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "trade_id" UUID;
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "balance_after" DECIMAL(28,8);
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE INDEX IF NOT EXISTS "ledger_entries_portfolio_id_timestamp_idx"
  ON "ledger_entries"("portfolio_id", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "ledger_entries_market_id_timestamp_idx"
  ON "ledger_entries"("market_id", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "ledger_entries_trade_id_idx"
  ON "ledger_entries"("trade_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_portfolio_id_fkey') THEN
    ALTER TABLE "ledger_entries"
      ADD CONSTRAINT "ledger_entries_portfolio_id_fkey"
      FOREIGN KEY ("portfolio_id") REFERENCES "Portfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_market_id_fkey') THEN
    ALTER TABLE "ledger_entries"
      ADD CONSTRAINT "ledger_entries_market_id_fkey"
      FOREIGN KEY ("market_id") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_trade_id_fkey') THEN
    ALTER TABLE "ledger_entries"
      ADD CONSTRAINT "ledger_entries_trade_id_fkey"
      FOREIGN KEY ("trade_id") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- market_odds_snapshots
CREATE TABLE IF NOT EXISTS "market_odds_snapshots" (
    "id" UUID NOT NULL,
    "market_id" UUID NOT NULL,
    "mid_yes" DECIMAL(10,9) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "market_odds_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "market_odds_snapshots_market_id_recorded_at_idx"
  ON "market_odds_snapshots"("market_id", "recorded_at" DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'market_odds_snapshots_market_id_fkey') THEN
    ALTER TABLE "market_odds_snapshots"
      ADD CONSTRAINT "market_odds_snapshots_market_id_fkey"
      FOREIGN KEY ("market_id") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- market_drafts
CREATE TABLE IF NOT EXISTS "market_drafts" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "suggestion_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" VARCHAR(64) NOT NULL,
    "narrative" VARCHAR(64),
    "status" "MarketDraftStatus" NOT NULL DEFAULT 'IN_REVIEW',
    "closes_at" TIMESTAMP(3),
    "resolution_source" TEXT,
    "rejection_reason" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "market_id" UUID,
    CONSTRAINT "market_drafts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "market_drafts_suggestion_id_key" ON "market_drafts"("suggestion_id");
CREATE UNIQUE INDEX IF NOT EXISTS "market_drafts_market_id_key" ON "market_drafts"("market_id");
CREATE INDEX IF NOT EXISTS "market_drafts_status_createdAt_idx" ON "market_drafts"("status", "createdAt" DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'market_drafts_suggestion_id_fkey') THEN
    ALTER TABLE "market_drafts"
      ADD CONSTRAINT "market_drafts_suggestion_id_fkey"
      FOREIGN KEY ("suggestion_id") REFERENCES "market_suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'market_drafts_market_id_fkey') THEN
    ALTER TABLE "market_drafts"
      ADD CONSTRAINT "market_drafts_market_id_fkey"
      FOREIGN KEY ("market_id") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
