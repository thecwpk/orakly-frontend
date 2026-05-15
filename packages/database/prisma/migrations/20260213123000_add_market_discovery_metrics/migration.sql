-- AlterTable
ALTER TABLE "Market" ADD COLUMN IF NOT EXISTS "signalProviderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Market" ADD COLUMN IF NOT EXISTS "signalHotScore" DECIMAL(22,8);
ALTER TABLE "Market" ADD COLUMN IF NOT EXISTS "signalLastSeenAt" TIMESTAMP(3);
ALTER TABLE "Market" ADD COLUMN IF NOT EXISTS "externalMomentumScore" DECIMAL(20,6) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Market_status_externalMomentumScore_idx" ON "Market"("status", "externalMomentumScore" DESC);
CREATE INDEX IF NOT EXISTS "Market_status_signalLastSeenAt_idx" ON "Market"("status", "signalLastSeenAt" DESC);
