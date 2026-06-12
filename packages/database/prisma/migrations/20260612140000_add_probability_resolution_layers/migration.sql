-- AlterEnum
ALTER TYPE "ResolutionStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';

-- AlterTable
ALTER TABLE "Market" ADD COLUMN IF NOT EXISTS "probability" DECIMAL(10,9);

-- CreateTable
CREATE TABLE IF NOT EXISTS "market_probability_snapshots" (
    "marketId" UUID NOT NULL,
    "probability" DECIMAL(10,9) NOT NULL,
    "probability_pct" DECIMAL(8,4) NOT NULL,
    "amm_ratio" DECIMAL(10,9) NOT NULL,
    "order_ratio" DECIMAL(10,9) NOT NULL,
    "degraded" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_probability_snapshots_pkey" PRIMARY KEY ("marketId")
);

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'market_probability_snapshots_marketId_fkey'
  ) THEN
    ALTER TABLE "market_probability_snapshots"
      ADD CONSTRAINT "market_probability_snapshots_marketId_fkey"
      FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
