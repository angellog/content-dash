-- NOT YET APPLIED. Ships separately, after 20260926_media_bucket_and_upload_policies.sql.
--
-- carousel-exports (oeaajq… only) lets the anon role INSERT and UPDATE any
-- object in the bucket. The bucket is public, so anyone holding the
-- publishable key could overwrite a slide that is already live on Instagram
-- or queued in post_queue, and the replacement would be served from the same
-- URL.
--
-- Who writes there, checked 2026-09-26:
--   * 45 objects in 7 folders, 2026-07-05 → 2026-09-08. Every one has
--     owner_id NULL (anon or service role); none was ever updated in place.
--   * No code in content-dash, feetbit-unified, feetbit-content-library,
--     carousel-maker or any other angellog repo names the bucket.
--   * The carousel skills (carousel, carousel-to-instagram) now hand images
--     over via Composio's upload_local_file (S3), not Supabase storage.
--   * No storage request for the bucket other than public reads in the
--     retained edge logs.
-- So the writes were ad-hoc agent sessions using the publishable key, and
-- nothing running today depends on them. A future writer should use the
-- service role, which bypasses RLS and needs no policy.
--
-- Dropping the two policies leaves writes to service_role only. Existing
-- public URLs keep working: public object reads do not go through RLS.
-- Reversible by re-creating the two policies (definitions are in git, in
-- supabase/base_schema.sql as of 2026-09-26).

DROP POLICY IF EXISTS carousel_exports_anon_write  ON storage.objects;
DROP POLICY IF EXISTS carousel_exports_anon_update ON storage.objects;
