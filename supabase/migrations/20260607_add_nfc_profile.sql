-- ContentDash: NFC Smart Profile system (v2 - fixed types)
-- Adds activation flow, profile table, link table, avatar storage
-- NOTE: NFCCard.id and NFCCard.userId are TEXT, not UUID

-- Add activation + profile slug columns to NFCCard (idempotent)
ALTER TABLE "NFCCard"
  ADD COLUMN IF NOT EXISTS "activationCode" TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "isActivated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "profileSlug" TEXT UNIQUE;

-- Create NFCProfile table (idempotent)
CREATE TABLE IF NOT EXISTS "NFCProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cardId" TEXT NOT NULL REFERENCES "NFCCard"("id") ON DELETE CASCADE UNIQUE,
  "displayName" TEXT NOT NULL,
  "bio" TEXT,
  "avatarUrl" TEXT,
  "theme" TEXT NOT NULL DEFAULT 'default',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create NFCLink table (idempotent)
CREATE TABLE IF NOT EXISTS "NFCLink" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL REFERENCES "NFCProfile"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "linkOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS "idx_nfc_profile_card_id" ON "NFCProfile"("cardId");
CREATE INDEX IF NOT EXISTS "idx_nfc_link_profile_id" ON "NFCLink"("profileId");
CREATE INDEX IF NOT EXISTS "idx_nfc_card_activation_code" ON "NFCCard"("activationCode");
CREATE INDEX IF NOT EXISTS "idx_nfc_card_profile_slug" ON "NFCCard"("profileSlug");

-- Link type check constraint (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_link_type') THEN
    ALTER TABLE "NFCLink"
      ADD CONSTRAINT "chk_link_type" CHECK ("type" IN (
        'instagram', 'whatsapp', 'google_review', 'phone', 'email',
        'website', 'maps', 'shop', 'booking', 'youtube', 'twitter',
        'linkedin', 'facebook', 'custom'
      ));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE "NFCProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NFCLink" ENABLE ROW LEVEL SECURITY;

-- RLS policies for NFCProfile (drop first for idempotency, use auth.uid()::text)
DROP POLICY IF EXISTS "Users can view their own profiles" ON "NFCProfile";
CREATE POLICY "Users can view their own profiles" ON "NFCProfile"
  FOR SELECT USING (
    "cardId" IN (SELECT "id" FROM "NFCCard" WHERE "userId" = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can insert their own profiles" ON "NFCProfile";
CREATE POLICY "Users can insert their own profiles" ON "NFCProfile"
  FOR INSERT WITH CHECK (
    "cardId" IN (SELECT "id" FROM "NFCCard" WHERE "userId" = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can update their own profiles" ON "NFCProfile";
CREATE POLICY "Users can update their own profiles" ON "NFCProfile"
  FOR UPDATE USING (
    "cardId" IN (SELECT "id" FROM "NFCCard" WHERE "userId" = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can delete their own profiles" ON "NFCProfile";
CREATE POLICY "Users can delete their own profiles" ON "NFCProfile"
  FOR DELETE USING (
    "cardId" IN (SELECT "id" FROM "NFCCard" WHERE "userId" = auth.uid()::text)
  );

-- RLS policies for NFCLink (drop first for idempotency, use auth.uid()::text)
DROP POLICY IF EXISTS "Users can view their own links" ON "NFCLink";
CREATE POLICY "Users can view their own links" ON "NFCLink"
  FOR SELECT USING (
    "profileId" IN (
      SELECT "NFCProfile"."id" FROM "NFCProfile"
      JOIN "NFCCard" ON "NFCProfile"."cardId" = "NFCCard"."id"
      WHERE "NFCCard"."userId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can insert their own links" ON "NFCLink";
CREATE POLICY "Users can insert their own links" ON "NFCLink"
  FOR INSERT WITH CHECK (
    "profileId" IN (
      SELECT "NFCProfile"."id" FROM "NFCProfile"
      JOIN "NFCCard" ON "NFCProfile"."cardId" = "NFCCard"."id"
      WHERE "NFCCard"."userId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can update their own links" ON "NFCLink";
CREATE POLICY "Users can update their own links" ON "NFCLink"
  FOR UPDATE USING (
    "profileId" IN (
      SELECT "NFCProfile"."id" FROM "NFCProfile"
      JOIN "NFCCard" ON "NFCProfile"."cardId" = "NFCCard"."id"
      WHERE "NFCCard"."userId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can delete their own links" ON "NFCLink";
CREATE POLICY "Users can delete their own links" ON "NFCLink"
  FOR DELETE USING (
    "profileId" IN (
      SELECT "NFCProfile"."id" FROM "NFCProfile"
      JOIN "NFCCard" ON "NFCProfile"."cardId" = "NFCCard"."id"
      WHERE "NFCCard"."userId" = auth.uid()::text
    )
  );

-- Public read policy for profile pages (anyone can view published profiles)
DROP POLICY IF EXISTS "Public read active profiles" ON "NFCProfile";
CREATE POLICY "Public read active profiles" ON "NFCProfile"
  FOR SELECT USING (
    "cardId" IN (SELECT "id" FROM "NFCCard" WHERE "isActivated" = true AND "profileSlug" IS NOT NULL)
  );

DROP POLICY IF EXISTS "Public read active links" ON "NFCLink";
CREATE POLICY "Public read active links" ON "NFCLink"
  FOR SELECT USING (
    "profileId" IN (
      SELECT "NFCProfile"."id" FROM "NFCProfile"
      JOIN "NFCCard" ON "NFCProfile"."cardId" = "NFCCard"."id"
      WHERE "NFCCard"."isActivated" = true AND "NFCCard"."profileSlug" IS NOT NULL
    )
  );
