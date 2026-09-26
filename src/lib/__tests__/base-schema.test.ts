import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

// Static guard-rails for supabase/base_schema.sql. The live-database check is
// scripts/db/base-schema.sh verify; these catch the drift that shows up in the
// repo itself — code touching a table or bucket the snapshot doesn't have.

const ROOT = path.resolve(__dirname, "../../..");
const snapshot = readFileSync(path.join(ROOT, "supabase/base_schema.sql"), "utf8");

const tables = new Set(
  [...snapshot.matchAll(/^CREATE TABLE public\.("?)([A-Za-z_]+)\1 \(/gm)].map((m) => m[2]),
);
const buckets = new Set(
  [...snapshot.matchAll(/^INSERT INTO storage\.buckets .*? VALUES \('([^']+)'/gm)].map((m) => m[1]),
);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (name === "__tests__" || name === "node_modules") return [];
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}
const source = sourceFiles(path.join(ROOT, "src"))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

// Buckets the code uses that do not exist on oeaajq… yet. Each entry is a
// known, tracked defect (PROJECT-STATUS.md §10) — remove it once the bucket is
// created, and this test will then insist the snapshot is regenerated.
const KNOWN_MISSING_BUCKETS = new Set(["media"]);

describe("supabase/base_schema.sql", () => {
  it("is a snapshot, not a migration, and says so", () => {
    expect(snapshot).toMatch(/BASE SCHEMA SNAPSHOT/);
    expect(snapshot).toMatch(/This is a SNAPSHOT of the current state, not a migration/);
    expect(snapshot).toMatch(/Supabase project: oeaajqcssoukezpqtbtg/);
  });

  it("builds in dependency order", () => {
    const order = [
      "1. Extensions", "2. Enum types", "3. Tables",
      "4. Primary keys and unique constraints", "5. Check constraints",
      "6. Foreign keys", "7. Indexes", "8. Functions", "9. Triggers",
      "10. Row level security", "11. Storage buckets and policies",
    ].map((title) => snapshot.indexOf(`-- ${title}\n`));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("contains all 18 tables and enables RLS on every one", () => {
    expect(tables.size).toBe(18);
    for (const t of tables) {
      const quoted = /^[a-z_]+$/.test(t) ? t : `"${t}"`;
      expect(snapshot).toContain(`ALTER TABLE public.${quoted} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it("covers every table the app reads or writes", () => {
    const used = new Set(
      [...source.matchAll(/(?<!storage\s*)\.from\(\s*["']([A-Za-z_]+)["']/g)].map((m) => m[1]),
    );
    const missing = [...used].filter((t) => !tables.has(t) && !buckets.has(t) && !KNOWN_MISSING_BUCKETS.has(t));
    expect(missing).toEqual([]);
  });

  it("covers every storage bucket the app uploads to (except tracked defects)", () => {
    const used = new Set(
      [...source.matchAll(/storage\s*\.from\(\s*["']([a-z0-9-]+)["']/g)].map((m) => m[1]),
    );
    const missing = [...used].filter((b) => !buckets.has(b));
    expect(missing.sort()).toEqual([...KNOWN_MISSING_BUCKETS].sort());
  });

  it("pins every function's search_path, with pgvector reachable from match_post_media", () => {
    const fns = snapshot.split("CREATE OR REPLACE FUNCTION").slice(1);
    expect(fns.length).toBe(3);
    for (const fn of fns) expect(fn).toMatch(/SET search_path TO /);
    const match = fns.find((f) => f.includes("public.match_post_media"))!;
    expect(match).toMatch(/SET search_path TO 'public', 'extensions'/);
  });

  it("keeps handle_new_user off the anon/authenticated API surface", () => {
    expect(snapshot).toContain(
      "REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;",
    );
  });
});
