#!/usr/bin/env bash
# Generate or verify supabase/base_schema.sql against the live oeaajq… project.
#
#   scripts/db/base-schema.sh generate   rewrite supabase/base_schema.sql from the live catalog
#   scripts/db/base-schema.sh verify     build the file into a scratch schema inside
#                                        BEGIN…ROLLBACK and diff every object class
#                                        against live; exits 1 on any mismatch
#
# Needs the Supabase CLI logged in (`supabase login`). Talks to the database
# through the Management API with the CLI's temporary login role — no DB
# password, nothing written to the repo's own supabase/.temp.
#
# The database is shared with feetbit-content-library, which carries an
# identical copy of the snapshot. After `generate`, copy the file there too:
#   cp supabase/base_schema.sql ../feetbit-content-library/supabase/base_schema.sql
set -euo pipefail

PROJECT_REF="${PROJECT_REF:-oeaajqcssoukezpqtbtg}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
SNAPSHOT="$ROOT/supabase/base_schema.sql"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/supabase/.temp"
printf '%s' "$PROJECT_REF" > "$WORK/supabase/.temp/project-ref"

run_sql_file() {  # $1 = file, $2 = output format
  (cd "$WORK" && supabase db query --linked --agent=no -o "$2" -f "$1" 2>&1 \
    | grep -v -e 'new version of Supabase CLI' -e 'recommend updating' -e 'Initialising login role')
}

link() {
  (cd "$WORK" && supabase link --project-ref "$PROJECT_REF" --workdir "$WORK" --yes </dev/null >/dev/null 2>&1) \
    || { echo "supabase link failed — run \`supabase login\` first" >&2; exit 1; }
}

case "${1:-}" in
  generate)
    link
    run_sql_file "$HERE/base-schema-generate.sql" json > "$WORK/gen.json"
    # header = everything up to and including the closing banner of the existing file
    awk '/^-- ={70,}$/ { n++ } { print } n == 3 { exit }' "$SNAPSHOT" > "$WORK/header.sql"
    jq -r '.[].line' "$WORK/gen.json" > "$WORK/body.sql"
    cat "$WORK/header.sql" "$WORK/body.sql" > "$SNAPSHOT"
    echo "wrote $SNAPSHOT ($(wc -l < "$SNAPSHOT" | tr -d ' ') lines) — update the header's date/counts, then run verify"
    ;;
  verify)
    link
    {
      cat <<'SQL'
BEGIN;
SET LOCAL search_path = pg_catalog;
CREATE SCHEMA bs_verify;
GRANT USAGE ON SCHEMA bs_verify TO anon, authenticated, service_role;
-- give the scratch schema the same default privileges Supabase gives public
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bs_verify GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bs_verify GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bs_verify GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
-- stand-ins for the two objects outside public that the snapshot attaches to
CREATE TABLE bs_verify._auth_users      (LIKE auth.users);
CREATE TABLE bs_verify._storage_objects (LIKE storage.objects);
-- 20260926_fix_match_post_media_search_path, idempotent; a no-op once applied live
ALTER FUNCTION public.match_post_media(extensions.vector, double precision, integer)
  SET search_path TO 'public', 'extensions';
SQL
      sed -e 's/ON auth\.users/ON bs_verify._auth_users/g' \
          -e 's/ON storage\.objects/ON bs_verify._storage_objects/g' \
          -e 's/public\./bs_verify./g' \
          -e "s/'public'/'bs_verify'/g" "$SNAPSHOT"
      cat "$HERE/base-schema-diff.sql"
      cat <<'SQL'
ROLLBACK;
SQL
    } > "$WORK/verify.sql"
    run_sql_file "$WORK/verify.sql" csv | tee "$WORK/result.csv"
    # columns: kind,live,rebuilt,mismatches,detail — fail on any non-zero mismatch
    if awk -F, 'NR > 1 && $4 != "" && $4 != "NULL" && $4 != "0" { bad = 1 } END { exit !bad }' "$WORK/result.csv"; then
      echo "MISMATCH — the snapshot has drifted from live" >&2; exit 1
    fi
    grep -q '^columns,' "$WORK/result.csv" || { echo "verify did not produce a result" >&2; exit 1; }
    echo "OK — snapshot builds cleanly and matches live (transaction rolled back)"
    ;;
  *)
    sed -n '2,8p' "$0"; exit 2 ;;
esac
