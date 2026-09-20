-- Applied to oeaajqcssoukezpqtbtg on 2026-09-21.
--
-- Lower stakes than the handle_new_user fix above: this function is NOT
-- SECURITY DEFINER, so it already runs with the invoker's privileges rather
-- than the owner's. Pinning search_path still clears the advisor and makes
-- name resolution deterministic regardless of the caller's setting.
--
-- Body unchanged.

CREATE OR REPLACE FUNCTION public.touch_video_queue_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin new.updated_at = now(); return new; end $function$;
