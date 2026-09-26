-- Appended after the rewritten snapshot inside BEGIN ... ROLLBACK.
-- Compares every object class in bs_verify (built from the file) to public (live).
WITH
n AS (SELECT 'public'::text AS live, 'bs_verify'::text AS scr),
norm AS (SELECT 1),
cols AS (
  SELECT nsp.nspname AS s, c.relname || '.' || a.attname || ':' || a.attnum || ':' ||
         replace(format_type(a.atttypid, a.atttypmod), 'bs_verify.', 'public.') || ':' || a.attnotnull::text || ':' ||
         a.attidentity::text || ':' || coalesce(replace(pg_get_expr(d.adbin, d.adrelid), 'bs_verify.', 'public.'), '') AS item
  FROM pg_class c JOIN pg_namespace nsp ON nsp.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
  WHERE nsp.nspname IN ('public','bs_verify') AND c.relkind IN ('r','p') AND c.relname NOT LIKE '\_%'
),
tabs AS (
  SELECT nsp.nspname AS s, c.relname || ':rls=' || c.relrowsecurity::text || ':force=' || c.relforcerowsecurity::text || ':acl=' || coalesce(c.relacl::text,'default') AS item
  FROM pg_class c JOIN pg_namespace nsp ON nsp.oid = c.relnamespace
  WHERE nsp.nspname IN ('public','bs_verify') AND c.relkind IN ('r','p') AND c.relname NOT LIKE '\_%'
),
enums AS (
  SELECT nsp.nspname AS s, t.typname || '=' ||
         (SELECT string_agg(enumlabel, ',' ORDER BY enumsortorder) FROM pg_enum WHERE enumtypid = t.oid) AS item
  FROM pg_type t JOIN pg_namespace nsp ON nsp.oid = t.typnamespace
  WHERE nsp.nspname IN ('public','bs_verify') AND t.typtype = 'e'
),
cons AS (
  SELECT nsp.nspname AS s, c.relname || '.' || co.conname || ':' || co.contype::text || ':' ||
         replace(pg_get_constraintdef(co.oid), 'bs_verify.', 'public.') AS item
  FROM pg_constraint co JOIN pg_class c ON c.oid = co.conrelid
  JOIN pg_namespace nsp ON nsp.oid = c.relnamespace
  WHERE nsp.nspname IN ('public','bs_verify') AND co.contype IN ('p','u','c','f','x') AND c.relname NOT LIKE '\_%'
),
idx AS (
  SELECT nsp.nspname AS s, replace(pg_get_indexdef(i.indexrelid), 'bs_verify.', 'public.') AS item
  FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid
  JOIN pg_namespace nsp ON nsp.oid = c.relnamespace
  WHERE nsp.nspname IN ('public','bs_verify') AND c.relname NOT LIKE '\_%'
),
pols AS (
  SELECT schemaname AS s, tablename || '.' || policyname || ':' || permissive || ':' || cmd || ':' ||
         array_to_string(roles, ',') || ':' ||
         coalesce(replace(qual, 'bs_verify.', 'public.'), '') || ':' ||
         coalesce(replace(with_check, 'bs_verify.', 'public.'), '') AS item
  FROM pg_policies WHERE schemaname IN ('public','bs_verify') AND tablename NOT LIKE '\_%'
),
funcs AS (
  SELECT nsp.nspname AS s,
         replace(replace(pg_get_functiondef(p.oid), 'bs_verify.', 'public.'), '''bs_verify''', '''public''')
         || ':acl=' || coalesce(replace(p.proacl::text, 'bs_verify', 'public'), 'default') AS item
  FROM pg_proc p JOIN pg_namespace nsp ON nsp.oid = p.pronamespace
  WHERE nsp.nspname IN ('public','bs_verify')
),
trigs AS (
  SELECT CASE WHEN c.relname = '_auth_users' OR nsp.nspname = 'auth' THEN
              CASE WHEN nsp.nspname = 'auth' THEN 'public' ELSE 'bs_verify' END
              ELSE nsp.nspname END AS s,
         replace(replace(pg_get_triggerdef(tg.oid), 'bs_verify._auth_users', 'auth.users'), 'bs_verify.', 'public.') AS item
  FROM pg_trigger tg JOIN pg_class c ON c.oid = tg.tgrelid
  JOIN pg_namespace nsp ON nsp.oid = c.relnamespace
  WHERE NOT tg.tgisinternal
    AND (nsp.nspname IN ('public','bs_verify') OR (nsp.nspname = 'auth' AND c.relname = 'users'))
),
spols AS (
  SELECT CASE WHEN schemaname = 'storage' THEN 'public' ELSE 'bs_verify' END AS s,
         policyname || ':' || permissive || ':' || cmd || ':' || array_to_string(roles, ',') || ':' ||
         coalesce(qual, '') || ':' || coalesce(with_check, '') AS item
  FROM pg_policies
  WHERE (schemaname = 'storage' AND tablename = 'objects') OR (schemaname = 'bs_verify' AND tablename = '_storage_objects')
),
allx AS (
  SELECT 'columns' AS kind, * FROM cols UNION ALL SELECT 'tables+rls', * FROM tabs
  UNION ALL SELECT 'enums', * FROM enums UNION ALL SELECT 'constraints', * FROM cons
  UNION ALL SELECT 'indexes', * FROM idx UNION ALL SELECT 'policies', * FROM pols
  UNION ALL SELECT 'functions', * FROM funcs UNION ALL SELECT 'triggers', * FROM trigs
  UNION ALL SELECT 'storage_policies', * FROM spols
)
SELECT kind,
       count(*) FILTER (WHERE s = 'public')    AS live,
       count(*) FILTER (WHERE s = 'bs_verify') AS rebuilt,
       (SELECT count(*) FROM (
          (SELECT item FROM allx a2 WHERE a2.kind = a.kind AND a2.s = 'public'
           EXCEPT ALL SELECT item FROM allx a3 WHERE a3.kind = a.kind AND a3.s = 'bs_verify')
          UNION ALL
          (SELECT item FROM allx a2 WHERE a2.kind = a.kind AND a2.s = 'bs_verify'
           EXCEPT ALL SELECT item FROM allx a3 WHERE a3.kind = a.kind AND a3.s = 'public')) d) AS mismatches,
       (SELECT string_agg(left(item, 200), ' || ') FROM (
          (SELECT 'LIVE-ONLY ' || item AS item FROM (SELECT item FROM allx a2 WHERE a2.kind = a.kind AND a2.s = 'public'
           EXCEPT ALL SELECT item FROM allx a3 WHERE a3.kind = a.kind AND a3.s = 'bs_verify') q)
          UNION ALL
          (SELECT 'FILE-ONLY ' || item FROM (SELECT item FROM allx a2 WHERE a2.kind = a.kind AND a2.s = 'bs_verify'
           EXCEPT ALL SELECT item FROM allx a3 WHERE a3.kind = a.kind AND a3.s = 'public') q)) d) AS detail
FROM allx a
GROUP BY kind
UNION ALL
SELECT 'storage_buckets(file rows present live)', (SELECT count(*) FROM storage.buckets), NULL, NULL, NULL
ORDER BY 1;
