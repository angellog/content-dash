-- Records hardening that was applied directly to oeaajqcssoukezpqtbtg and had
-- never been written down. The database already matches this file exactly —
-- running it is a no-op — but until now the fix existed only in the live
-- project, which is the drift this repo keeps getting bitten by.
--
-- 1. search_path is pinned. Without it a SECURITY DEFINER function resolves
--    unqualified names against the CALLER's search_path, which is the whole
--    point of the lint.
-- 2. EXECUTE is revoked from anon/authenticated/PUBLIC. This is a trigger
--    function — triggers fire as the table owner regardless of EXECUTE grants,
--    so signup is unaffected — but leaving the grant also exposed it at
--    /rest/v1/rpc/handle_new_user, which was never intended.
--
-- Verified against the live project on 2026-09-21: the function definition
-- below is byte-identical to pg_get_functiondef output, and the ACL is exactly
-- postgres=X/postgres | service_role=X/postgres.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public."User" (id, email, name, image)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
