-- Community voting + submitter attribution on market suggestions
CREATE TYPE "SuggestionVoteDirection" AS ENUM ('UP', 'DOWN');

ALTER TABLE "market_suggestions" ADD COLUMN IF NOT EXISTS "submitter_id" UUID;

ALTER TABLE "market_suggestions"
  ADD CONSTRAINT "market_suggestions_submitter_id_fkey"
  FOREIGN KEY ("submitter_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "market_suggestions_submitter_id_idx" ON "market_suggestions"("submitter_id");

CREATE TABLE IF NOT EXISTS "market_suggestion_votes" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suggestion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "direction" "SuggestionVoteDirection" NOT NULL,

    CONSTRAINT "market_suggestion_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "market_suggestion_votes_suggestion_id_user_id_key"
  ON "market_suggestion_votes"("suggestion_id", "user_id");

CREATE INDEX IF NOT EXISTS "market_suggestion_votes_user_id_idx" ON "market_suggestion_votes"("user_id");

ALTER TABLE "market_suggestion_votes"
  ADD CONSTRAINT "market_suggestion_votes_suggestion_id_fkey"
  FOREIGN KEY ("suggestion_id") REFERENCES "market_suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "market_suggestion_votes"
  ADD CONSTRAINT "market_suggestion_votes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
