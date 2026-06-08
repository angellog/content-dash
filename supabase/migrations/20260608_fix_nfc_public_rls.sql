-- ContentDash: Fix public RLS policies for NFC tap flow
-- NFCCard needs public read by slug (for /t/[cardSlug] and /p/[profileSlug])
-- NFCTapEvent needs public insert (for tap logging)

-- Public read on NFCCard: anyone can look up a card by cardSlug or profileSlug
-- This is needed by /t/[cardSlug] (tap redirect) and /p/[profileSlug] (public profile)
DROP POLICY IF EXISTS "Public read activated cards by slug" ON "NFCCard";
CREATE POLICY "Public read activated cards by slug" ON "NFCCard"
  FOR SELECT USING (
    "cardSlug" IS NOT NULL OR "profileSlug" IS NOT NULL
  );

-- Public read on NFCCard for unactivated cards (needed by /t/ to show "not activated" page)
DROP POLICY IF EXISTS "Public read cards by cardSlug" ON "NFCCard";
CREATE POLICY "Public read cards by cardSlug" ON "NFCCard"
  FOR SELECT USING (
    "cardSlug" IS NOT NULL
  );

-- Anon can insert tap events (no auth required for NFC tap logging)
DROP POLICY IF EXISTS "Anon can insert tap events" ON "NFCTapEvent";
CREATE POLICY "Anon can insert tap events" ON "NFCTapEvent"
  FOR INSERT WITH CHECK (true);

-- Card owners can read their own tap events
DROP POLICY IF EXISTS "Users can view their own tap events" ON "NFCTapEvent";
CREATE POLICY "Users can view their own tap events" ON "NFCTapEvent"
  FOR SELECT USING (
    "cardId" IN (SELECT "id" FROM "NFCCard" WHERE "userId" = auth.uid()::text)
  );
