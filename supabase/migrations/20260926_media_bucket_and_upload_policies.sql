-- Make the two user-upload routes able to succeed.
--
-- /api/omnisocial/upload writes to a bucket named `media` that did not exist,
-- and /api/nfc/avatar writes to `nfc-avatars`, which existed on oeaajq… but had
-- no storage.objects policies. Both routes use the user-session SSR client
-- (publishable key + the caller's JWT, role `authenticated`), so storage RLS
-- applies and, with no policy, every upload was refused. The OmniSocial route
-- could only ever answer 500; the NFC editor dropped the avatar and still said
-- "saved". `nfc-avatars` held 0 objects — it has never worked.
--
-- Object paths the routes write, and so what the policies pin to the caller:
--   media        uploads/<auth.uid()>/<timestamp>.<ext>   (upsert: false)
--   nfc-avatars  <auth.uid()>/<cardId>.<ext>              (upsert: true)
--
-- An upsert is INSERT … ON CONFLICT DO UPDATE inside the storage API, so
-- nfc-avatars needs owner-scoped SELECT + UPDATE as well as INSERT. `media`
-- never overwrites, so INSERT alone is enough. No DELETE policy: neither route
-- deletes.
--
-- Both buckets are public — the routes hand back getPublicUrl() links that
-- OmniSocial and the public /p/[profileSlug] profile page fetch anonymously. Public
-- object URLs bypass RLS, so there is deliberately NO broad SELECT policy:
-- that would only add file listing (advisor 0025_public_bucket_allows_listing).
-- The nfc-avatars SELECT policy is owner-scoped, so a user can list only their
-- own folder.
--
-- Because these buckets are public and served from the project's own domain,
-- they take an explicit MIME allowlist (no SVG, no HTML) and a size cap.
-- 50 MB is the plan's global per-file limit.
--
-- Idempotent, and the same file is used for both databases: on oeaajq… it
-- creates `media` and tightens the empty `nfc-avatars`; on ujzx… (which had no
-- buckets at all) it creates both.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('media', 'media', true, 52428800,
   '{image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime}'::text[]),
  ('nfc-avatars', 'nfc-avatars', true, 5242880,
   '{image/jpeg,image/png,image/webp,image/gif}'::text[])
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- media: a signed-in user may create objects under uploads/<their uid>/ only.
DROP POLICY IF EXISTS media_owner_insert ON storage.objects;
CREATE POLICY media_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'uploads'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

-- nfc-avatars: a signed-in user owns <their uid>/.
DROP POLICY IF EXISTS nfc_avatars_owner_insert ON storage.objects;
CREATE POLICY nfc_avatars_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'nfc-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS nfc_avatars_owner_select ON storage.objects;
CREATE POLICY nfc_avatars_owner_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'nfc-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- WITH CHECK mirrors USING so an object cannot be moved out of its owner's folder.
DROP POLICY IF EXISTS nfc_avatars_owner_update ON storage.objects;
CREATE POLICY nfc_avatars_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'nfc-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'nfc-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
