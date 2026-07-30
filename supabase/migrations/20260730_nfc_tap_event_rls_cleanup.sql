-- ContentDash: tighten and de-duplicate NFCTapEvent row-level security.
--
-- The table had four policies forming two exact duplicate pairs:
--
--   INSERT  "Anon can insert tap events"      {anon,authenticated}  WITH CHECK (true)
--   INSERT  "Anyone can insert tap events"    {public}              WITH CHECK (true)
--   SELECT  "Users can read own tap events"   {public}              own-card subquery
--   SELECT  "Users can view their own tap events" {public}          same subquery
--
-- The unrestricted INSERT let anyone with the (publishable) anon key POST
-- arbitrary rows straight at PostgREST and inflate any card's tap analytics.
-- It existed only because /t/[cardSlug] logged taps with the anon key; that
-- route now writes with the service role, which bypasses RLS, so no public
-- INSERT policy is needed at all.
--
-- Apply this ONLY together with the /t/[cardSlug] service-role change —
-- dropping these policies while the route still uses the anon key would
-- silently stop tap logging.

DROP POLICY IF EXISTS "Anon can insert tap events" ON "NFCTapEvent";
DROP POLICY IF EXISTS "Anyone can insert tap events" ON "NFCTapEvent";

-- Collapse the duplicate owner-read policies to one. Kept the more explicit
-- name; the surviving policy has the identical USING expression, so read
-- access is unchanged.
DROP POLICY IF EXISTS "Users can read own tap events" ON "NFCTapEvent";
