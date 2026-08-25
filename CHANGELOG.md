# ContentDash Changelog

All notable changes to ContentDash are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.4.3] - 2026-08-24

### Security

**Anyone with the publishable key could read every NFC card's activation code**

`NFCCard` carried two policies granting `SELECT` to anon — `"Public read cards
by cardSlug"` and the broader `"Public read activated cards by slug"`, which
despite its name never checked `isActivated`. RLS is row-level, not
column-level, so neither could limit which columns came back. Any card with a
slug handed over `activationCode`, `txRef`, `flwTransactionId` and the owner's
`userId`.

`activationCode` is `UNIQUE` and is what claims an unactivated card, so this was
enough to let someone claim a card they had not bought.

Confirmed rather than inferred: a probe row was inserted into the (empty) table,
read back as `anon` — all four columns returned — and deleted.

The policies were load-bearing, which is why the fix is a code change first.
`/t/[cardSlug]` and `/p/[profileSlug]` both read `NFCCard` with the publishable
key, so the policies could not simply be dropped:

- `/t/[cardSlug]` now resolves the card with the service-role client it already
  built for the tap insert, and reuses that one client for both. If
  `SUPABASE_SERVICE_ROLE_KEY` is missing it now fails loudly with a 503 instead
  of rendering "Card Not Found", which would have blamed the card for a server
  misconfiguration.
- `/p/[profileSlug]` reads through a new `publicReader()` helper on the service
  role. This page also had to move: `NFCProfile` and `NFCLink` have public
  policies that *subquery* `NFCCard`, so they would have gone dark for anon the
  moment the card policy was dropped. Both callers still filter on
  `isActivated`, so unactivated cards stay private.

`supabase/migrations/20260824_drop_nfc_card_public_read.sql` drops both policies
and is marked **do not apply until this ships** — dropping them against the old
code turns every tap into "Card Not Found". Same ordering trap as the
`NFCTapEvent` cleanup in 2.4.2.

No cards exist in either database yet, so nothing was actually exposed.

## [2.4.2] - 2026-07-30

### Fixed

**NFC tap analytics: anyone could inflate them, and real taps were being dropped**

`NFCTapEvent` carried four RLS policies forming two exact duplicate pairs — two `INSERT` policies both `WITH CHECK (true)`, and two identical owner-read `SELECT` policies. The unrestricted INSERT meant anyone holding the publishable anon key could POST arbitrary rows straight at PostgREST and inflate any card's tap count.

It existed only because `/t/[cardSlug]` logged taps with the anon key. That route now writes with the service role, which bypasses RLS, so the table needs no public INSERT policy at all — `supabase/migrations/20260730_nfc_tap_event_rls_cleanup.sql` drops both, plus one of the duplicate SELECT policies.

Separately, the same insert was fire-and-forget (`.insert({...}).then(() => {})`, never awaited). It raced the redirect response, and a serverless instance that froze after responding dropped the row with no trace — so an unknown share of taps were never recorded. It is now awaited, with failures logged and never allowed to break the redirect itself.

## [2.4.1] - 2026-07-30

### Fixed

**The linter was reporting 31,173 problems and was therefore being ignored**

`eslint.config.mjs` ignored `.next/**` root-anchored. Agent worktrees under `.claude/worktrees/` are full checkouts of this same repo and carry their own build output, so the nested `.claude/worktrees/*/.next/` was linted as source: 31,173 problems (1,541 errors), essentially all of it minified vendor code. The 49 real findings were unfindable inside it. Ignores are now `**/`-prefixed, and `.claude/worktrees/**` is excluded outright.

With the noise gone, the real errors were fixable:

- `src/app/page.tsx` — `totalPostsTrend` declared `let` and never reassigned. It is permanently `null` by design (OmniSocial returns no period-over-period delta for post volume, so the card renders "—"); now `const`, with the reason recorded.
- `src/app/whatsapp/page.tsx` — dead `isLive` state: written on every successful fetch, never read. Removed. The `react-hooks/set-state-in-effect` error on the mount fetch is a false positive (the callback awaits before touching state) and is now suppressed at that line with the reasoning, rather than left as a standing error.
- `src/lib/__tests__/nfc-schemas.test.ts` — `require("crypto")` inside a `describe` block replaced with a top-level import.

Also: a `no-unused-vars` convention (`^_` for args, vars, caught errors, and array destructuring) so route handlers that take `req` purely to match Next.js's shape can say so; unused params renamed accordingly; and ~20 dead imports removed across the app.

Net: **31,173 → 17 problems, 0 errors.**

**NFC card configuration could never be saved**

`handleConfigSave` POSTed a body `/api/nfc/cards` always rejected — no `cardSlug` (required), `targetUrl` where the schema reads `destinationUrl`, and `redirectType.toUpperCase()` producing `LINKINBIO`/`WHATSAPP`/`CUSTOM` against an enum of `INSTAGRAM | LINK_IN_BIO | WHATSAPP_CHAT | CUSTOM_URL`. Every save 400'd, and because the handler only had an `if (res.ok)` branch, the failure was silent — the form looked like it did nothing. Now sends a valid slug, the right field name, and a mapped enum value, and surfaces the server's error in a toast. (Same three-way mismatch as the checkout path fixed in 2.4.0; this was the other caller.)

## [2.4.0] - 2026-07-30

### Fixed

**NFC checkout was unsellable, and the payment webhook trusted its caller**

The Smart NFC Card storefront, its checkout API, and the `NFCCard` table each had a different idea of what a card is and what it costs. Found while hardening the Flutterwave webhook; all of it is one flow, so it ships as one change.

- **Only one of three finishes could be ordered.** The storefront offered `matte-black` / `brushed-gold` / `brushed-silver`; `paymentPostSchema` accepted `matte-black` / `pearl-white` / `rose-gold` / `chrome-silver` / `obsidian-carbon`; the `NFCColor` DB enum has `MATTE_BLACK` / `BRUSHED_GOLD` / `STERLING_SILVER`. Gold and silver were rejected at validation (400); the schema's other four colours would have failed the insert (500). Matte black was the only path that completed. All three now agree on the DB enum's vocabulary, and the silver option's value matches its "Sterling Silver" label.
- **The quoted price was not the charged price.** The storefront quotes quantity bundles (1/$29, 3/$69, 5/$99, 10/$149); the checkout route billed $29.99 per card per colour, so a "3 Cards ($69.00) — Save 20%" order charged $89.97. Pricing is now one colour-independent quantity table in `src/lib/nfc-pricing.ts`, shared by the storefront, the checkout route, and the webhook's amount check. `quantity` is restricted to the bundles actually quoted.
- **The checkout discarded the customer's redirect target.** The storefront sent `targetUrl` and an unmapped `redirectType` (`LINKINBIO`, `WHATSAPP`); the API reads `destinationUrl` and a `NFCRedirectType` enum. Every paid card was created pointing at the `https://contentdash.ai` default. Both are now mapped correctly.

**Payment webhook hardening**

- The webhook created a brand-new `NFCCard` straight from unverified `meta` on the request body — a forged payload minted a free card. It now re-verifies the transaction against Flutterwave's `/transactions/{id}/verify`, matches it back to the card created at checkout via a stored `tx_ref`, checks currency and amount against the shared price table, and flips that row to `PAID` rather than inserting anything.
- Idempotent: repeat deliveries of the same event are ignored once the card has left `ORDERED`.
- Uses the service-role client (the old cookie-less `createServerClient` was operating under the anon key), and returns a non-2xx on misconfiguration so Flutterwave retries instead of silently dropping a paid order.

### Database

Applied to `oeaajqcssoukezpqtbtg` — `supabase/migrations/20260710_add_nfc_txref.sql`:
`NFCCard.txRef` (+ partial unique index) and a new `PAID` label on the `NFCOrderStatus` enum, between `ORDERED` and `PRINTED`.

## [2.3.1] - 2026-07-15

### Fixed

**The recurring post-deploy "Invalid login credentials" trap**

Diagnosis: the same email exists as two independent accounts — ContentDash + Content Library share one Supabase project, FeetBit Unified has its own with a separately-set password — while all three apps showed an identical "ContentDash" login screen. Every redeploy forces a fresh manual login (new deployment URL → no session cookie, no password-manager autofill), and entering the *other* app's password returns GoTrue's bare "Invalid login credentials" (confirmed in auth logs: a rejection followed by a success with the correct password seconds later — the account was never broken). Three-layer fix:

- Login screen now states the credential space: "Same account as the Content Library. FeetBit Unified is separate."
- "Invalid login credentials" is translated into an actionable message naming which apps share this account.
- **Build-time project pinning** in `next.config.ts`: the build fails loudly if `NEXT_PUBLIC_SUPABASE_URL` is missing or points at a project other than `oeaajqcssoukezpqtbtg` — a wrong-project build (the silent failure mode that shipped a login page rejecting every real user) can no longer deploy. Escape hatch: `ALLOW_SUPABASE_PROJECT_MISMATCH=1` for intentional migrations.

## [2.3.0] - 2026-07-14

### Changed

**Analytics — honesty pass**
- Removed a ~600-line archived/dead code block from the Analytics page.
- Stat-card trend arrows were decorative (hardcoded "this period" with a fake up/down); replaced with an honest "For selected range" caption — the OmniSocial overview endpoint returns no period-over-period delta.
- Added a Shares column to the Top Posts table (the metric was already in the API response, just unshown).
- Follower-growth and time-series charts remain intentionally absent — the OmniSocial API doesn't return that data; documented rather than faked.

**Competitor feature — real metrics (dormant-ready) + honesty**
- Competitor metric columns (followers, engagement, posting frequency) were dead — nothing wrote them, and a "Scraping Live" badge was hardcoded. Added a real pipeline via the Instagram Graph API `business_discovery` field (through the feetbit-content-library bridge): a per-competitor Refresh button computes follower count, engagement rate, and posting frequency from live public business/creator data and persists them with a `lastScrapedAt` timestamp.
- Dormant-ready: until an Instagram Graph token is configured on the bridge, refresh reports "not configured" and nothing is fabricated.
- Fields `business_discovery` cannot provide (ad spend, audience demographics, comment sentiment, follower activity) now read "Not tracked" explicitly instead of showing fake/empty placeholders; audience health shows "Unrated" when there's no real sentiment data; the "Scraping Live" badge is now an honest "On watchlist".

## [2.2.0] - 2026-06-07

### Added

**NFC Smart Profile System**

ContentDash now supports NFC Smart Profiles — when someone taps an activated NFC card, they see a beautiful public profile page with the card owner's name, bio, avatar, and customizable social/contact links instead of a simple URL redirect.

- **Activation code flow**: purchasing an NFC card generates an 8-character alphanumeric activation code; user enters the code in the Smart Profile Editor to activate the card and link it to their account
- **Smart Profile Editor** (`/nfc/editor`): step-by-step UI — enter activation code → edit profile (display name, bio, avatar) → add/reorder/remove links (14 types) → QR code preview → save
- **Public profile page** (`/p/[profileSlug]`): mobile-first layout with radial glow background, avatar, name, bio, and styled link buttons with type-specific emoji icons and colors; serves OG metadata for social sharing
- **Avatar upload** (`/api/nfc/avatar`): file upload to Supabase Storage bucket `nfc-avatars`, public read access
- **Activation endpoint** (`/api/nfc/activate`): validates activation code, marks card as activated, links to user account
- **Profile CRUD** (`/api/nfc/profile`): GET fetches profile + links by cardId; PUT upserts profile and replaces all links; auto-generates `profileSlug` from displayName
- **Tap route update** (`/t/[cardSlug]`): unactivated cards show styled HTML landing page; activated cards with `profileSlug` redirect to `/p/[profileSlug]`; activated cards without profile fall back to `destinationUrl`
- **Database migration** (`supabase/migrations/20260607_add_nfc_profile.sql`): `NFCProfile` table (cardId PK, displayName, bio, avatarUrl, theme), `NFCLink` table (id, cardId FK, type with CHECK constraint for 14 types, label, url, linkOrder), activation columns on `NFCCard` (`activationCode`, `isActivated`, `profileSlug`), RLS policies (owner CRUD via cardId→NFCCard→userId join, public read for activated cards), indexes
- **14 link types**: instagram, whatsapp, google_review, phone, email, website, maps, shop, booking, youtube, twitter, linkedin, facebook, custom — each with emoji icon in editor and colored styling on public page
- **QR code preview** in editor: generates QR code pointing to public profile URL using `qrcode` package
- **NFC ordering page update**: success state prominently shows activation code with "Set up your Smart Profile" prompt and link to editor
- **`/p/` public route**: added to proxy public paths (no auth required)

### Changed

- **`src/types/db.ts`**: added `NFCLinkType`, `NFCProfile`, `NFCLink` interfaces; `NFCCard` extended with `activationCode`, `isActivated`, `profileSlug`
- **`src/lib/validations/schemas.ts`**: added `nfcActivateSchema`, `nfcProfileUpsertSchema` with nested links array validation
- **`src/app/api/payments/route.ts`**: generates `activationCode` (8-char alphanumeric), `profileSlug`, `cardSlug` on order; creates NFCCard row before Flutterwave call; returns codes in response

---

## [2.1.0] - 2026-06-07

### Added

**Hermes Agent Framework Integration**

ContentDash now supports two agent frameworks — the existing OpenClaw (cloud LLM APIs) and the new Hermes (self-hosted LLM endpoint). Users select their preferred framework in Settings, and the agent dispatch layer routes requests accordingly.

- **Framework selector** in Settings page: choose between "OpenClaw (Cloud LLM APIs)" and "Hermes (Self-Hosted LLM)"
- **Conditional settings UI**: OpenClaw shows LLM provider dropdown + API key; Hermes shows endpoint URL + optional API key
- **`callHermesAgent()` function** (`src/lib/llm.ts`): full Hermes ChatML prompt builder with `<tools>` XML schema, `<scratch_pad>` reasoning framework, and `tool_call>` XML parsing
- **Framework badge** on OpenClaw command center page (amber for Hermes, purple for OpenClaw)
- **Database migration** (`supabase/migrations/20260605_add_agent_framework.sql`): adds `agentFramework` (default `'openclaw'`), `hermesEndpointUrl`, `hermesApiKeyEncrypted` columns to `AgentConfig` table with CHECK constraint
- **`HERMES_DEFAULT_ENDPOINT_URL`** env var for fallback endpoint configuration
- **13 new tests** for Hermes: ChatML message formatting, `tool_call>` XML response parsing, endpoint URL normalization, auth header handling
- **Zod schema update**: `agentConfigPutSchema` extended with `agentFramework` enum, `hermesEndpointUrl` (validated as URL), `hermesApiKey`

### Changed

- **`src/lib/llm.ts`**: `LLMProvider` type extended to include `"hermes"`; `callLLM()` throws if called with hermes provider (use `callHermesAgent()` instead); added `HermesConfig` and `AgentFramework` exported types
- **`src/app/api/agent/config/route.ts`**: GET returns `agentFramework`, `hermesEndpointUrl`, `hermesApiKeyMasked`; PUT accepts and persists all Hermes fields with encryption
- **`src/app/api/agent/execute/route.ts`**: reads `agentFramework` from config, dispatches to `callHermesAgent()` or `callLLM()` based on selection; validates Hermes endpoint URL is configured before dispatching
- **`src/app/api/agent/whatsapp/route.ts`**: same framework dispatch logic for incoming WhatsApp commands; validates both OpenClaw API key and Hermes config before proceeding
- **`src/types/db.ts`**: `AgentConfig` interface extended with `agentFramework`, `hermesEndpointUrl`, `hermesApiKeyEncrypted`; added `AgentFramework` type
- **`src/app/settings/page.tsx`**: `handleSaveAgent()` now sends framework-conditional fields (LLM fields only for OpenClaw, Hermes fields only for Hermes); better error display from API responses
- **`.env.example`**: added `HERMES_DEFAULT_ENDPOINT_URL` section

### Technical Details — Hermes ChatML Protocol

The Hermes integration follows the [NousResearch Hermes-Function-Calling](https://github.com/NousResearch/Hermes-Function-Calling) specification:

1. **System prompt** includes `<tools>[...]</tools>` XML block with OpenAI-compatible function schemas
2. **Function call schema** uses the pydantic `FunctionCall` model: `{"name": string, "arguments": object}`
3. **Tool calls** are enclosed in `tool_call>` / `</tool_call>` XML tags containing JSON
4. **Scratch pad reasoning** uses `<scratch_pad>` / `</scratch_pad>` XML tags for goal-oriented action planning (GOAP)
5. **Tool results** are wrapped in `tool_response>` / `</tool_response>` XML tags
6. **Messages** follow ChatML format: `<|im_start|>role\ncontent<|im_end|>`
7. **Endpoint compatibility**: expects OpenAI-compatible `/v1/chat/completions` endpoint (works with vLLM, Ollama, LM Studio)

---

## [2.0.0] - 2026-06-04

### Major overhaul: security hardening, API validation, live data wiring, LLM tool calling, rate limiting, and test suite.

This release represents a comprehensive 9-phase maintenance plan that addressed critical security vulnerabilities, hardened all API endpoints, wired every page to live data, added multi-turn LLM tool calling, implemented rate limiting, and introduced a full test suite.

---

### Phase 1: Critical Security Fixes

#### Fixed

- **Twilio HMAC-SHA1**: WhatsApp webhook signature validation now uses `createHmac("sha1", ...)` with `timingSafeEqual` for constant-time comparison — previously vulnerable to timing attacks
- **Flutterwave `timingSafeEqual`**: payment webhook hash comparison upgraded from string equality to constant-time comparison
- **Encryption fallbacks removed**: `decrypt()` and `encrypt()` now throw on failure instead of falling back to exposing raw keys or plaintext. Callers receive 500 errors rather than silently serving unencrypted data
- **`userId` in executor writes**: all tool implementations (`executeTool`) now accept and write `userId` to Supabase rows — previously some tools (NFC cards, competitor watches, WhatsApp campaigns) were writing rows without user ownership, creating multi-tenancy violations
- **WhatsApp multi-tenancy fix**: webhook handler now matches incoming messages against `twilioWhatsappNumber` in `AgentConfig` table to identify the correct user — previously any authenticated user could trigger any other user's agent
- **`proxy.ts` restored**: Next.js 16 uses `proxy.ts` convention (not `middleware.ts`). Build was warning about deprecated `middleware.ts`. File renamed and route handlers updated
- **`destinationUrl` unified**: NFC card creation now requires and validates `destinationUrl` as a URL — previously accepted empty strings
- **try/catch on agent loop**: the while-iteration loop in agent execute and WhatsApp routes now catches errors, logs failures to `AgentLog`, and returns structured error responses instead of crashing the server

---

### Phase 2: API Hardening

#### Added

- **Zod** (`zod@3.23`) installed for runtime request validation
- **8 Zod schemas** in `src/lib/validations/schemas.ts`:
  - `agentExecuteSchema` — validates `{ message: string, source: "web"|"whatsapp"|"api" }`
  - `agentConfigPutSchema` — validates LLM provider enum, API keys, Twilio config, active flag
  - `paymentPostSchema` — validates card color enum, quantity, NFC redirect fields
  - `nfcCardPostSchema` — validates card slug (regex), name, URL, color/redirect enums
  - `nfcCardPatchSchema` — strict mode (no extra keys), partial updates
  - `whatsappCampaignPostSchema` — validates campaign name, media URL, caption, scheduled datetime
  - `competitorPostSchema` — validates brand name, optional handles
  - `omnisocialConfigPutSchema` — validates API key or MCP URL input with `.refine()`
- **`validateBody()`** helper: returns `{ data }` or `{ error }` for clean error handling in route handlers

#### Changed

- All 7 API routes now validate request bodies with Zod before processing
- **NFC PATCH** uses `strict()` mode — rejects unknown keys with descriptive errors
- **DELETE routes** now use URL path params instead of request body:
  - `/api/competitors/[id]` — DELETE by competitor ID in URL
  - `/api/nfc/cards/[id]` — DELETE by card ID in URL
- **PATCH `/api/competitors/[id]`** added for partial competitor updates

---

### Phase 3: LLM Multi-Turn Tool Calling

#### Added

- **`AgentMessage` type** with `toolCalls?: ToolCall[]`, `toolCallId?: string`, `toolCallName?: string` fields — enables proper multi-turn conversation with tool results
- **OpenAI formatter**: assistant messages with tool_calls include `tool_calls` array with `{id, type: "function", function: {name, arguments}}` format; tool messages include `tool_call_id`
- **Anthropic formatter**: assistant messages with tool_calls use content blocks (`{type: "text"}` and `{type: "tool_use", id, name, input}`); tool results wrapped as `{role: "user", content: [{type: "tool_result", tool_use_id, content}]}`
- **Gemini formatter**: assistant messages use `{role: "model", parts: [{functionCall: {name, args}}]}`; tool results use `{role: "user", parts: [{functionResponse: {name, response: {content}}}]}`

#### Changed

- **`SYSTEM_PROMPT`** updated with OpenClaw agent identity, tool usage rules, Instagram carousel format instructions, and error handling guidelines
- **Agent execute route** (`/api/agent/execute`): full multi-turn loop — calls LLM, if tool_calls returned, pushes assistant + tool messages, executes tools, continues until `finishReason === "stop"` or max iterations (8) reached
- **WhatsApp route** (`/api/agent/whatsapp`): same multi-turn loop for WhatsApp-initiated commands

---

### Phase 4: Configuration

#### Added

- **`next.config.ts`** populated:
  - `images.remotePatterns` for OmniSocial media URLs
  - `serverExternalPackages` for encryption modules
- **`ENCRYPTION_SALT`** env var: encryption salt is now configurable instead of hardcoded. Backward-compatible — if not set, falls back to `"contentdash-salt-v1"`
- **`.env.example`** updated with all required environment variables and comments

#### Changed

- **Encryption**: `src/lib/encryption.ts` reads `ENCRYPTION_SALT` from env for key derivation. Existing data encrypted with the old salt can be decrypted by temporarily setting `ENCRYPTION_SALT=contentdash-salt-v1`, then rotating

---

### Phase 5: Live Data Wiring

#### Changed

- All 10 pages now fetch from API routes instead of using hardcoded mock data:
  - **Dashboard** — OmniSocial accounts + analytics
  - **Analytics** — OmniSocial analytics API with platform breakdowns
  - **Calendar** — scheduled posts from OmniSocial
  - **Competitors** — Supabase `CompetitorWatch` table
  - **News** — RSS news feed via Supabase Edge Function
  - **WhatsApp Billboard** — Supabase `WhatsAppBillboardCampaign` table
  - **NFC Cards** — Supabase `NFCCard` table
  - **OpenClaw** — agent logs from Supabase `AgentLog` table
  - **Settings** — OmniSocial + agent config from API
  - **Social Manager** — OmniSocial posts + Zustand store

---

### Phase 6: Store & Features

#### Added

- **Zustand `addPost`/`deletePost`** persist to API: store actions now POST/DELETE to `/api/omnisocial/posts` and `/api/omnisocial/upload` instead of only updating local state
- **Dev-only demo data**: Zustand store initializer only populates demo posts when `NODE_ENV === "development"` — production starts clean
- **`/api/omnisocial/upload`** route: handles image upload for social media posts
- **`/api/whatsapp/campaigns/[id]`** DELETE route: delete a WhatsApp billboard campaign by ID

#### Changed

- **Post cards** now show platform badges and scheduled time from live data

---

### Phase 7: Rate Limiting & Auth

#### Added

- **In-memory sliding window rate limiter** (`src/lib/rate-limit.ts`):
  - Configurable per-endpoint limits and window sizes
  - `RATE_LIMITS` config object: `agentExecute` (10 req/min), `payments` (5 req/min)
  - `getRateLimitHeaders()` returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **`/api/auth/callback`** route: handles Supabase OAuth callback
- **Login page improvements**: cleaner UI, email + password form, OAuth buttons

#### Changed

- **Agent execute route**: rate limited at 10 requests/minute per IP
- **Payment routes**: rate limited at 5 requests/minute per IP
- Rate limit exceeded returns 429 with headers and retry-after info

---

### Phase 8: UI Cleanup

#### Added

- **Header wired**: search input functional (filters sidebar nav), sign-out button calls `supabase.auth.signOut()`, notification bell with count badge
- **Sidebar live connection status**: green "OmniSocial Connected" or red "Not Connected" indicator based on Zustand store `syncState.isLive`
- **`PostTypeBadge` component** in post-card: color-coded badge per platform (Instagram=gradient, X=blue, LinkedIn=blue, etc.)
- **Tailwind scrollbar hide**: custom utility class for hiding scrollbars on overflow containers

#### Changed

- **`src/components/layout/sidebar.tsx`**: connection status section between nav and settings link

---

### Phase 9: Testing

#### Added

- **Vitest + jsdom** installed as dev dependencies
- **`vitest.config.ts`** with `@/` path alias
- **42 tests across 4 files** (now 55 across 5 with Hermes):
  - `src/lib/__tests__/encryption.test.ts` — AES-256-GCM encrypt/decrypt, salt configuration, invalid key handling
  - `src/lib/__tests__/schemas.test.ts` — all 8 Zod schemas, valid/invalid inputs, strict mode, enum constraints
  - `src/lib/__tests__/rate-limit.test.ts` — sliding window, limit enforcement, window reset, header generation
  - `src/lib/__tests__/llm-formatting.test.ts` — OpenAI/Anthropic/Gemini message formatting, tool_calls in multi-turn, tool_result wrapping

---

### Removed

- **Prisma ORM** entirely removed — Supabase handles all runtime queries and migrations (Option A: Supabase-only)
- **`middleware.ts`** removed — replaced with `proxy.ts` (Next.js 16 convention)
- **Encryption fallback logic** — failures now throw instead of returning raw data
- **Hardcoded mock data** from all pages — replaced with API calls

---

## [1.5.0] - 2026-06-03

### Added

- **AI Agent with WhatsApp command channel** (`d547810`):
  - OpenClaw autonomous agent page (`/openclaw`) with command center UI
  - Agent execute API (`/api/agent/execute`) — accepts natural language commands, calls LLM, executes tools
  - WhatsApp webhook (`/api/agent/whatsapp`) — receives Twilio messages, validates signature, runs agent
  - Agent config API (`/api/agent/config`) — CRUD for LLM provider, API keys, Twilio config
  - Agent logs API (`/api/agent/logs`) — retrieve execution history
  - 6 tool implementations: `fetch_news`, `post_to_omnisocial`, `create_whatsapp_campaign`, `add_competitor`, `get_analytics`, `manage_nfc_card`
  - Multi-provider LLM client (`src/lib/llm.ts`): OpenAI (GPT-4o), Anthropic (Claude Sonnet), Gemini (2.0 Flash)

---

## [1.4.0] - 2026-06-02

### Changed

- **NFC tap route fixed** to use Supabase instead of Prisma (`2d03111`)
- **Replaced all Stripe references with Flutterwave** — payment processing now uses Flutterwave for African market NFC card checkout
- **Removed `stripe` and `@stripe/stripe-js` packages**

---

## [1.3.0] - 2026-06-01

### Added

- **Flutterwave integration** for NFC card checkout payments (`8ae9db2`):
  - `/api/payments` POST route — initiates Flutterwave card charge
  - `/api/payments/webhook` POST route — handles Flutterwave webhook with hash validation
  - Card color options: matte-black, pearl-white, rose-gold, chrome-silver, obsidian-carbon
- **Sonner toasts** for user notifications
- **Loading skeletons** on data-fetching pages
- **News send-to-pipeline** flow: send articles directly to social posting pipeline

---

## [1.2.0] - 2026-05-31

### Changed

- **Consolidated env vars** to `.env`, added `.env.example`, fixed `.gitignore` (`c9e351d`)
- **Migrated `middleware.ts` to `proxy.ts`** — Next.js 16 uses `proxy` convention, build warns if `middleware` is used (`8cef9c7`)

---

## [1.1.0] - 2026-05-30

### Added

- **RSS news feed** via Supabase Edge Function
- **API key encryption at rest** — AES-256-GCM with `OMNISOCIAL_ENCRYPTION_KEY`
- **All pages wired to Supabase API routes** (`6322383`):
  - Social Manager — OmniSocial posts API
  - Competitors — Supabase `CompetitorWatch`
  - NFC Cards — Supabase `NFCCard`
  - WhatsApp — Supabase `WhatsAppBillboardCampaign`
  - News — RSS via Supabase Edge Function

---

## [1.0.5] - 2026-05-29

### Added

- **Analytics page** wired to OmniSocial analytics API with live fallback (`22b1501`)
- **Auth middleware** — protects routes, redirects unauthenticated users (`7a92597`)
- **Dashboard and Calendar** wired to OmniSocial data (`7a92597`)

---

## [1.0.4] - 2026-05-28

### Added

- **MCP URL support** in OmniSocial connection (`8d94fd6`):
  - Settings page toggle between API Key and MCP URL input modes
  - Auto-extraction of API key from MCP URLs
  - Validation against OmniSocial API for both modes

---

## [1.0.3] - 2026-05-27

### Added

- **OmniSocial API connection** (`026ed5a`):
  - Supabase client routes for OmniSocial config and accounts
  - Login page with email + OAuth
  - RLS policies on all tables
  - Auth trigger for new user provisioning
  - Settings page validation against OmniSocial API

---

## [1.0.2] - 2026-05-26

### Added

- **Supabase project provisioning** (`34f369e`):
  - Schema applied with all tables
  - Pooler connection configured
  - Environment variables documented

---

## [1.0.1] - 2026-05-25

### Added

- **Social Manager wired to OmniSocial API routes** with demo data fallback (`4726c54`)

---

## [1.0.0] - 2026-05-24

### Added

- **Initial release** of ContentDash AI content management dashboard powered by OmniSocial (`ae482d4`):
  - Dashboard with metrics overview
  - Social Manager with 10-platform support (Instagram, Facebook, LinkedIn, Threads, TikTok, YouTube, Pinterest, Bluesky, Mastodon, X)
  - Content Calendar
  - Analytics page
  - Competitor Watch
  - News feed
  - WhatsApp Billboard
  - NFC Cards
  - Settings page
  - OmniSocial API integration
  - Supabase auth and database
  - Prisma ORM schema
  - NFC tap redirect engine

---

## [0.1.0] - 2026-05-23

### Added

- Project scaffolded with Create Next App (`da1ece0`)
