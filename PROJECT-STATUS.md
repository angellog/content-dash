# FeetBit Platform — Project Status & Architecture Reference

> Written 2026-07-15 as a durable snapshot of the full three-repo system: what exists,
> what shipped, what's dormant awaiting external setup, and what's deliberately deferred.
> Companion to each repo's own `CLAUDE.md` (architecture) and `CHANGELOG.md` (history).
>
> **Last updated 2026-08-24** — security-hardening pass on `ujzx…` (§5), open to-do in §10.

---

## 1. The three repos

| Repo | Purpose | Production URL | Version |
|---|---|---|---|
| **content-dash** | Original standalone dashboard (Social Manager, Analytics, Competitors, NFC, WhatsApp, OpenClaw agent, Content Library *bridge*) | https://content-dash-rho.vercel.app | 2.4.2 |
| **feetbit-content-library** | Content approval + Instagram publishing app (4K Stogram import, CLIP search, Graph API/Composio publish, cron scheduler). App lives in `dashboard/` subdir | https://dashboard-alpha-gold-92.vercel.app | 0.3.1 |
| **feetbit-unified** | The "real merge" product — content-dash's shell + specialized agents + Workspace. Still calls feetbit-content-library over the HTTP bridge (native absorption pending) | https://feetbit-unified.vercel.app | 0.4.0 |

GitHub: `angellog/content-dash`, `angellog/feetbit-content-library`, `angellog/feetbit-unified`.
All three are Vercel Git-connected: **merging to `main` auto-deploys**. feetbit-content-library's
Vercel project has **Root Directory = `dashboard`** (required; documented in its CLAUDE.md — without
it Git builds fail with "no pages or app directory").

**Standing rule:** every applicable change is ported to all three repos (feetbit-unified must never
fall behind). Flow: feature branch → PR → user-approved merge → auto-deploy. Changelog + version
bump every release.

## 2. Supabase projects & credential spaces (IMPORTANT)

Two projects, **two separate account/password spaces** — the source of every past
"invalid login credentials after deploy" report:

| Project ref | Used by | Notes |
|---|---|---|
| `oeaajqcssoukezpqtbtg` | content-dash + feetbit-content-library (shared) | posts/post_media/target_accounts/post_queue (+ inbox_items pending), all content-dash app tables |
| `ujzxpssjvdoitpdkrpmr` | feetbit-unified only | Own copies of app tables + Organization/Workspace |

The same email exists in BOTH with independently-set passwords. Since v2.3.1/0.3.1 each app's
login names its credential space, "Invalid login credentials" errors explain the split, and each
repo's `next.config.ts` **pins builds to its expected project ref** — a missing/wrong
`NEXT_PUBLIC_SUPABASE_URL` fails the build loudly (escape hatch: `ALLOW_SUPABASE_PROJECT_MISMATCH=1`).

## 3. The bridge (content-dash / feetbit-unified → feetbit-content-library)

Server-to-server via `src/lib/api/library-proxy.ts` (session-gated) and
`src/lib/agent/library-bridge.ts` (agent executors), both calling the library's `/api/bridge/*`
routes with `Authorization: Bearer FEETBIT_LIBRARY_BRIDGE_SECRET`.

Bridge surface: `posts` (GET/PATCH), `queue` (GET/POST/PATCH/DELETE), `post-status`, `stats`
(optional `?target_id=`), `search`, `targets`, `inbox` (GET/PATCH, `target_id` +
`expected_target_id` guards), `competitor-insights` (dormant, see §6).

**Safety posture:** the bridge can queue content but *never* publishes directly — publishing only
happens via the library's own scheduler cron (GitHub Actions `*/10min` + daily Vercel cron fallback,
`CRON_SECRET`-gated). Same posture for engagement: agents can *draft* replies, never send.

## 4. Everything shipped this cycle (July 2026)

1. **Auth hardening** — explicit `emailRedirectTo`/`redirectTo` from `window.location.origin`
   (no more Site-URL localhost links), real forgot-password flow + `/reset-password`, fixed
   callback cookie persistence, fixed missing callback route in the library.
2. **Content Library ↔ Social Manager status sync** — `posts.status` gains `published` (scheduler
   write-back; was frozen at `queued` forever), one shared `mapPublishStatus()` module, React Query
   activated for live cross-page cache invalidation, Library tabs restructured to mirror Social
   Manager kanban + "Needs Review", cancel/reschedule via bridge.
3. **Specialized agents** (feetbit-unified only) — persona layer over the OpenClaw engine, enforced
   server-side (tool allowlists in `src/lib/agent/personas.ts` + defense-in-depth in the execute
   route). Four characters: **Vetta** (Content Review), **Relay** (Scheduling), **Scout**
   (Competitor & Trend), **Echo** (Engagement — draft-only by design). Dedicated pages at
   `/agents/[personaId]`, dashboard panel, Command Center persona selector, `AgentLog.personaId`.
4. **Workspace** (feetbit-unified) — named bindings of the dashboard to one Instagram page
   (`target_accounts` row); one active per user (partial unique index). Locks Dashboard stats,
   Social Manager library lane, and hard-locks Relay + Echo to the page's `target_id` (enforced at
   the bridge). Vetta/Scout are context-aware only (their data has no page association). Sidebar
   switcher + `/settings/workspaces`.
5. **Multi-tenant groundwork (Phase 1, inert)** — `Organization`/`OrganizationMember` tables, seed
   org `00000000-0000-4000-8000-000000000001` ("FeetBit"), nullable unenforced `orgId`/`org_id`
   backfilled across both databases. Nothing reads it yet; it makes Phase 2 additive.
6. **Engagement/inbox infra** (library) — `inbox_items` design, Meta IG webhook
   (`/api/webhooks/instagram`: hub.challenge + HMAC), `/api/bridge/inbox` with the deliberate
   draft-vs-send split. **Dormant** (see §6).
7. **Item 10** — Analytics honesty pass (deleted ~600-line dead block, honest trend captions,
   Shares column; follower-growth/time-series absent because OmniSocial's API lacks them — documented,
   not faked). Competitor real metrics via IG `business_discovery` — full pipeline built
   **dormant-ready** (see §6); UI shows "Not tracked" for un-suppliable fields, "Unrated" health,
   "On watchlist" instead of the fake "Scraping Live" badge; per-competitor Refresh button
   (`POST /api/competitors/[id]/refresh`) + Scout's `get_competitor_insights` tool.
8. **Login credential-space fix** (v2.3.1/0.3.1) — see §2. feetbit-unified rebranded
   ("FeetBit Unified" login + sidebar; it used to say "ContentDash").

## 5. Database migrations applied (live)

| Project | Migration |
|---|---|
| oeaajq… | `posts.status` check gains `'published'`; `org_id` (nullable) + backfill on posts/post_media/target_accounts/post_queue |
| ujzx… | `AgentLog.personaId`; `Organization` + `OrganizationMember` + seed org + `orgId` backfill; `Workspace` table + one-active-per-user partial unique index |

Added 2026-07-30/31 (v2.4.x in content-dash, v0.4.0 in feetbit-unified):

| Project | Migration |
|---|---|
| oeaajq… | `NFCCard.txRef` + partial unique index; `'PAID'` added to `NFCOrderStatus` between ORDERED and PRINTED; `NFCTapEvent` RLS cleanup — dropped two always-true INSERT policies and one duplicate SELECT policy |
| ujzx… | `NFCCard.txRef` + partial unique index; `'PAID'` added to `NFCOrderStatus`; same `NFCTapEvent` RLS cleanup |

Both tap-RLS cleanups were applied **after** the matching code deployed. `/t/[cardSlug]` now writes
tap events with the service role; dropping the anon INSERT policy while the old anon-key route was
still live would have silently stopped tap logging.

**Two things worth knowing before you next touch a database here:**

1. **A restoring project reads as empty, not as an error.** During the 2026-07-31 restore, `ujzx…`
   answered queries with zero tables and zero auth users for several minutes before its real schema
   appeared — which briefly looked like catastrophic data loss and led to a wrong conclusion that
   the migrations in the row above had never been applied. They had. Confirm `status` is
   `ACTIVE_HEALTHY` (not `COMING_UP`) before concluding anything is missing.
2. **No repo can rebuild its database from zero.** Every file in `supabase/migrations/` is
   incremental; the earliest (`20260604_add_indexes_and_enums.sql`) opens with
   `ALTER TABLE "AgentLog"` and notes it "replaces the former Prisma schema management". The
   `CREATE TABLE` statements left with Prisma. That is a genuine gap if a database is ever lost —
   the fix is to generate a base schema by introspecting a healthy project, not to hand-write one
   against a live project that already has its schema.

Added 2026-08-24 (security-hardening pass, `ujzx…` only — `oeaajq…` already had all of this):

| Project | Migration |
|---|---|
| ujzx… | `handle_new_user` — pinned `SET search_path TO 'public'`, revoked `EXECUTE` from `anon`/`authenticated`/`PUBLIC`, leaving `postgres` + `service_role` (matches `oeaajq…` exactly) |
| ujzx… | RLS enabled on `Workspace`, `Organization`, `OrganizationMember` — all three were reachable with the publishable anon key. `Workspace` gets owner-scoped SELECT/INSERT/UPDATE/DELETE on `userId = auth.uid()`; `Organization`/`OrganizationMember` get owner-scoped SELECT, writes service-role only |
| ujzx… | Dropped `meridian_leads` + `meridian_payments` — an unrelated project's tables that had been created in this database by mistake. `meridian_payments` was empty; all 9 `meridian_leads` rows were synthetic smoke tests (`.dev`/`.test` addresses, 2026-07-11/12). No real data lost |

The `Workspace` policies are **defence in depth, not a behaviour change**: `/api/workspaces`,
`/api/workspaces/[id]` and `/api/agent/execute` all reach the table through the user-session SSR
client and already filter `.eq("userId", user.id)` in code. Verified after applying — as the owner's
uid the table returned its row, as another uid and as `anon` it returned zero, and `/api/workspaces`
still answers `401` (auth guard) rather than `500`.

`Organization`'s policy deliberately avoids being referenced by `OrganizationMember`'s policy, so the
two cannot recurse through each other.

**Not applied** (staged in library `schema.sql`/CLAUDE.md, intentionally): `inbox_items` table —
engagement isn't live until Meta review + env vars. New `post_queue` rows get null `org_id` until
Phase 2 wires inserts — acceptable while unenforced.

## 6. Dormant features — code complete, awaiting EXTERNAL setup (owner-only steps)

| Feature | What's needed to go live |
|---|---|
| **Competitor insights** (business_discovery) | A Facebook-Login Graph token: Meta app + FB Page linked to an IG business account → set `IG_GRAPH_API_TOKEN` + `IG_GRAPH_USER_ID` on the library deploy. Until then endpoints return 503 NOT_CONFIGURED (nothing fabricated). Note: Composio (used for publishing) exposes no raw token and cannot query arbitrary accounts — that's why a separate credential is required. |
| **Engagement/inbox** (IG comments/DMs) | Apply `inbox_items` migration; set `META_APP_SECRET` + `META_WEBHOOK_VERIFY_TOKEN`; subscribe the webhook in the Meta dashboard; pass Meta App Review for `instagram_manage_comments`/`instagram_manage_messages`. A human "Send" UI for drafted replies is intentionally unbuilt. |
| **feetbit-unified local dev** | `.env`'s `SUPABASE_SERVICE_ROLE_KEY` / `DATABASE_URL` / `DIRECT_URL` are still the stale content-dash ones (public URL/anon key were fixed). Only the owner can retrieve the correct values (Supabase dashboard → ujzx project). |

## 7. Deliberately deferred

- **Multi-tenancy Phase 2** — bridge protocol carrying verified `orgId`, RLS on the *library's*
  content tables, org/invite/membership UI, per-org billing (Flutterwave). Wait for a real second
  tenant. (RLS on feetbit-unified's own `Workspace`/`Organization`/`OrganizationMember` is no longer
  part of this — it was done 2026-08-24, see §5.)
- **Native absorption** — folding the library's schema + publish pipeline into feetbit-unified's
  own project (removing the HTTP bridge hop). Tracked in feetbit-unified's CLAUDE.md.
- **OmniSocial gaps** — follower-growth & time-series analytics blocked on their API.
- Optional: nightly competitor-refresh cron (mirror the scheduler pattern) once the token exists.

## 8. Key env vars (per deploy)

- **All three:** `NEXT_PUBLIC_SUPABASE_URL` (+ anon key) — build-pinned per repo (§2);
  `SUPABASE_SERVICE_ROLE_KEY`.
- **content-dash & feetbit-unified:** `FEETBIT_LIBRARY_URL`, `FEETBIT_LIBRARY_BRIDGE_SECRET`,
  `OMNISOCIAL_ENCRYPTION_KEY` (Vercel "Sensitive" = write-only, unrecoverable), Flutterwave keys,
  Twilio (WhatsApp agent channel).
- **library:** `BRIDGE_SECRET`, `CRON_SECRET`, `COMPOSIO_API_KEY`, and the dormant Meta/IG vars (§6).
- Per-user encrypted in-DB (AgentConfig): LLM key (OpenAI/Anthropic/Gemini) — **required for any
  agent to run**; Higgsfield key; Hermes endpoint/key. OmniSocial API key (OmniSocialConfig) —
  required for live dashboard stats + posting/analytics tools only.

## 9. Conventions to keep

- Branch → PR → explicit user approval → merge (auto-deploys). Never push directly to `main`.
- Changelog entry + semver bump in every release PR; keep CLAUDE.md architecture notes current.
- Honesty rule for UI: never fake metrics — absent data reads "Not tracked"/"—" with the reason.
- Agents never auto-publish or auto-send; queue/draft only. Persona tool allowlists enforced
  server-side.
- DB changes to the **shared** project need user review before applying; feetbit-unified's own
  project may be migrated directly when additive (per established practice this session).

## 10. Open to-do (as of 2026-08-24)

Health at time of writing: both Supabase projects `ACTIVE_HEALTHY`; all three repos on `main`, clean
and in sync with origin; content-dash 2.4.2, library 0.3.1, feetbit-unified 0.4.0 all deployed.
**Zero ERROR-level security advisors on either database.**

**Owner-only (cannot be done from a session — needs dashboard access):**

| # | Item | Where |
|---|---|---|
| 1 | Enable leaked-password protection (HaveIBeenPwned check). The last remaining advisor **on both projects**. Auth setting, not SQL. | Supabase → Authentication → Policies, both projects |
| 2 | feetbit-unified local dev still has stale content-dash `SUPABASE_SERVICE_ROLE_KEY` / `DATABASE_URL` / `DIRECT_URL` in `.env` | Supabase dashboard → `ujzx…` |
| 3 | Dormant features awaiting external setup — see §6 (Meta token, Meta App Review) | Meta dashboard |

**Engineering, ready to pick up:**

| # | Item | Why it matters |
|---|---|---|
| 4 | **Generate a base schema migration by introspecting a healthy project.** No repo can rebuild its database from zero (see §5). This is the only item here that is a real recovery risk. | Blocks disaster recovery |
| 5 | `gbp_queue` on `oeaajq…` has RLS enabled with no policies — locked to service role. Confirm that is intended, or give it policies. | INFO-level advisor |
| 6 | Port the `handle_new_user` hardening pattern into `supabase/migrations/` as tracked SQL. Both projects now match, but the fix was applied directly and is not in any repo's migration files. | Drift between DB and repo |
| 7 | **`NFCCard` leaks every column to anon on BOTH projects.** `"Public read cards by cardSlug"` is `USING ("cardSlug" IS NOT NULL)`, and RLS is row-level, not column-level — so anon gets `activationCode`, `txRef`, `flwTransactionId` and `userId` for any slugged card, not just the five columns `/t/[cardSlug]` needs. Verified with a probe row, since both card tables are empty. `oeaajq…` also carries a second, broader `"Public read activated cards by slug"` policy that despite its name does not check `isActivated`. **Not urgent — zero cards exist, so nothing is exposed today — but must be fixed before the first card sells.** The policy is load-bearing: `/t/[cardSlug]` reads the card with the anon key, so it cannot simply be dropped. Fix is to move that lookup to the service-role client the route already builds, then drop the public policies — deploying the code *before* the migration, per the trap in §5. | Credential exposure once cards exist — **fix in flight**, see below |

**Item 7 is a two-part change, and the order matters.** The code fix is open as
content-dash PR #9 and feetbit-unified PR #8; each ships its own
`20260824_drop_nfc_card_public_read.sql` carrying a DO-NOT-APPLY-UNTIL-DEPLOYED header.

    merge → auto-deploy → verify a real tap resolves → then apply the migration

Applying the migration first turns every tap redirect into "Card Not Found" and every public
profile into "Profile Not Found". That is the same trap §5 records from the `NFCTapEvent`
cleanup, which is why the policy drop is deliberately not bundled with the code.

Worth knowing for anyone reviewing: `/p/[profileSlug]` had to move to the service role too,
which is not obvious from the leak itself. `NFCProfile` and `NFCLink` carry their own public
policies, but those *subquery* `NFCCard` — and a policy expression applies the referenced
table's RLS — so they stop returning rows to anon the moment the card policy is dropped.

Once both land and the migrations run, `feetbit-unified/supabase/base_schema.sql` needs
regenerating: it reproduces the doomed policy faithfully, because it is a snapshot of what the
database *is*, not what it should be.

**Deliberately not doing** — see §7. Phase-2 multi-tenancy still waits for a real second tenant.

**Housekeeping:** `supabase/.temp/` and `.vercel/` show as dirty in content-dash and the library
respectively; both are local CLI scratch dirs, not worth committing — candidates for `.gitignore`.
