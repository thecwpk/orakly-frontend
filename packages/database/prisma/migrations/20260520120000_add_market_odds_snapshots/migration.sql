-- Sparse YES mid snapshots for 24h mover ranking and optional hub composite.

CREATE TABLE "market_odds_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "market_id" UUID NOT NULL,
    "mid_yes" DECIMAL(10, 9) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_odds_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "market_odds_snapshots_market_id_recorded_at_idx" ON "market_odds_snapshots"("market_id", "recorded_at" DESC);

ALTER TABLE "market_odds_snapshots" ADD CONSTRAINT "market_odds_snapshots_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
