-- =============================================================================
-- DO NOT APPLY UNTIL THE MATCHING CODE IS DEPLOYED.
--
-- /t/[cardSlug] and /p/[profileSlug] must already be reading with the service
-- role. Dropping these policies while either still uses the publishable key
-- turns every tap redirect into "Card Not Found" and every public profile into
-- "Profile Not Found" — the same ordering trap as the NFCTapEvent cleanup in
-- 20260730_nfc_tap_event_rls_cleanup.sql.
-- =============================================================================
--
-- Both policies grant SELECT on NFCCard to anon. RLS is row-level, not
-- column-level, so neither can restrict which columns come back: any card with
-- a slug handed over activationCode, txRef, flwTransactionId and the owner's
-- userId to anyone holding the publishable key. activationCode is UNIQUE and is
-- what claims an unactivated card.
--
-- Verified before writing this, on a probe row inserted into the (empty) table
-- and then deleted: as anon, all four of those columns came back.
--
-- The second policy is broader than its name suggests — despite "activated" it
-- never checked isActivated, and it also matched on profileSlug.
--
-- Nothing anonymous needs to read NFCCard any more, so both go. NFCProfile's
-- and NFCLink's own public policies subquery NFCCard and therefore stop
-- returning rows to anon once these are gone; that is intended, because those
-- pages now read with the service role too.

DROP POLICY IF EXISTS "Public read cards by cardSlug"       ON "NFCCard";
DROP POLICY IF EXISTS "Public read activated cards by slug" ON "NFCCard";
