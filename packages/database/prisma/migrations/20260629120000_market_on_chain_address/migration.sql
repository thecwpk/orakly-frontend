-- Link listings to on-chain Market.sol clones (BSC testnet).
ALTER TABLE "Market" ADD COLUMN IF NOT EXISTS "on_chain_address" VARCHAR(42);
ALTER TABLE "Market" ADD COLUMN IF NOT EXISTS "chain_id" INTEGER;
CREATE INDEX IF NOT EXISTS "Market_on_chain_address_idx" ON "Market"("on_chain_address");
