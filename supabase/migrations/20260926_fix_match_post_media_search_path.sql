-- Restore the library's image-similarity search.
--
-- The 2026-07-28 migration pin_search_path_on_functions (applied straight to
-- the database; it is in no repo) pinned match_post_media to
-- search_path = 'public'. pgvector lives in the extensions schema, so inside
-- the function the <=> operator no longer resolves and every call fails:
--
--   ERROR 42883: operator does not exist: extensions.vector <=> extensions.vector
--
-- That is feetbit-content-library's /api/similar (visual search over the
-- 8,110 embedded post_media rows), broken for two months without a report.
--
-- Adding 'extensions' keeps the search_path pinned — the
-- function_search_path_mutable advisor stays satisfied — while letting the
-- operator resolve. Verified inside BEGIN…ROLLBACK on 2026-09-26: with this
-- change the live function returns matches; without it, it errors.
--
-- Additive only (widens nothing, restricts nothing); safe to apply at any time
-- and idempotent. The same file lives in feetbit-content-library, which owns
-- the function — apply it once.

ALTER FUNCTION public.match_post_media(extensions.vector, double precision, integer)
  SET search_path TO 'public', 'extensions';
