-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerEntryType') THEN
    CREATE TYPE "LedgerEntryType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'TRADE', 'PNL', 'REFUND');
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ledger_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(28,8) NOT NULL,
    "tx_hash" VARCHAR(128),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ledger_entries_user_id_timestamp_idx"
  ON "ledger_entries"("user_id", "timestamp" DESC);

CREATE INDEX IF NOT EXISTS "ledger_entries_type_timestamp_idx"
  ON "ledger_entries"("type", "timestamp" DESC);

CREATE INDEX IF NOT EXISTS "ledger_entries_tx_hash_idx"
  ON "ledger_entries"("tx_hash");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_user_id_fkey'
  ) THEN
    ALTER TABLE "ledger_entries"
      ADD CONSTRAINT "ledger_entries_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
