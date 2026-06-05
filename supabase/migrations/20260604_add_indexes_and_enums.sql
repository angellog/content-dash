-- ContentDash: Add indexes, enums, and constraints
-- Replaces the former Prisma schema management

-- Convert AgentLog.status from text to enum
DO $$ BEGIN
  CREATE TYPE "AgentLogStatus" AS ENUM ('completed', 'failed', 'running');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "AgentLog"
  ALTER COLUMN "status" TYPE "AgentLogStatus" USING "status"::"AgentLogStatus";

-- Convert AgentLog.source from text to enum
DO $$ BEGIN
  CREATE TYPE "AgentLogSource" AS ENUM ('web', 'whatsapp', 'api');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "AgentLog"
  ALTER COLUMN "source" TYPE "AgentLogSource" USING "source"::"AgentLogSource";

-- Add missing indexes
CREATE INDEX IF NOT EXISTS "idx_nfc_tap_events_card_id" ON "NFCTapEvent"("cardId");
CREATE INDEX IF NOT EXISTS "idx_nfc_tap_events_tapped_at" ON "NFCTapEvent"("tappedAt");
CREATE INDEX IF NOT EXISTS "idx_agent_logs_user_created" ON "AgentLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_competitor_watches_user_id" ON "CompetitorWatch"("userId");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_campaigns_user_status" ON "WhatsAppBillboardCampaign"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_nfc_cards_user_id" ON "NFCCard"("userId");

-- Add unique constraint to prevent duplicate competitor watches
ALTER TABLE "CompetitorWatch"
  ADD CONSTRAINT "uq_competitor_user_brand" UNIQUE ("userId", "brandName");
