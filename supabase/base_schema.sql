-- =============================================================================
-- content-dash + feetbit-content-library — BASE SCHEMA SNAPSHOT
-- Supabase project: oeaajqcssoukezpqtbtg ("content-dash")   Postgres 17
-- Generated 2026-09-26 by introspecting the live, healthy project.
-- =============================================================================
--
-- WHY THIS FILE EXISTS
--
-- Every file in supabase/migrations/ is incremental. The earliest one
-- (20260604_add_indexes_and_enums.sql) opens with ALTER TABLE "AgentLog" and
-- notes that it "replaces the former Prisma schema management" — the CREATE
-- TABLE statements left with Prisma and were never replaced. Worse, 20 of the
-- 25 migrations recorded in supabase_migrations.schema_migrations (2026-07-03
-- → 2026-09-21) were applied straight from the dashboard/MCP and exist in no
-- repo — including every CREATE TABLE for gbp_queue, caption_profiles,
-- video_queue and video_series. Until this file, the database could not be
-- rebuilt if lost.
--
-- ONE DATABASE, TWO REPOS
--
-- This project is shared: content-dash owns the PascalCase tables ("User",
-- "NFCCard", "AgentConfig", ...); feetbit-content-library owns the snake_case
-- content tables (posts, post_media, post_queue, target_accounts,
-- caption_profiles, gbp_queue, video_queue, video_series). A rebuild needs all
-- of it, so the SAME file is committed to both repos:
--     content-dash/supabase/base_schema.sql
--     feetbit-content-library/supabase/base_schema.sql
-- Regenerate both together (see HOW TO REGENERATE) — never hand-edit one.
--
-- HOW TO USE IT
--
-- This is a SNAPSHOT of the current state, not a migration. It already
-- includes everything the files in migrations/ did.
--
--   Rebuilding from zero:  run THIS FILE ALONE against a new Supabase project.
--                          Do NOT then replay migrations/ — they would fail
--                          trying to add columns that are already here.
--                          Then restore data (pg_restore --data-only from a
--                          backup) and reset identity sequences with
--                          setval(pg_get_serial_sequence(...), max(id)).
--   Ongoing changes:       keep writing incremental files in migrations/,
--                          and regenerate this snapshot when it drifts.
--
-- Every name is schema-qualified, so the file does not depend on search_path.
-- The build order is dependency order: extensions → enums → tables → keys →
-- checks → foreign keys → indexes → functions → triggers → RLS → storage.
--
-- HOW TO REGENERATE / VERIFY  (content-dash repo, needs `supabase login`)
--
--   scripts/db/base-schema.sh generate   # rewrites this file from the live catalog
--   scripts/db/base-schema.sh verify     # builds it into a scratch schema inside
--                                        # BEGIN…ROLLBACK and diffs every object
--                                        # class against live — must print 0s
--
-- Verified 2026-09-26: built cleanly into an empty scratch schema, then
-- matched live exactly — 18 tables (RLS + grants), 220 columns, 9 enums,
-- 49 constraints, 48 indexes, 39 policies, 3 functions (+ACLs), 2 triggers,
-- 3 storage policies, 6 buckets. 0 mismatches. A mutation test (one changed
-- default, one dropped policy, one dropped index) was caught 3/3.
--
-- ONE DELIBERATE DIFFERENCE FROM LIVE (until the fix migration is applied)
--
-- match_post_media is written here with SET search_path TO 'public',
-- 'extensions'. Live still has 'public' only — the untracked 2026-07-28
-- migration pin_search_path_on_functions pinned it without 'extensions', so
-- pgvector's <=> operator stopped resolving and every call has failed since
-- ("operator does not exist: extensions.vector <=> extensions.vector"). That
-- is the library's image-similarity search (/api/similar). The fix is
-- migrations/20260926_fix_match_post_media_search_path.sql; once applied, live
-- and this file agree exactly. (A snapshot of the broken definition would not
-- even build: SQL function bodies are validated at CREATE time.)
--
-- WHAT IS NOT HERE
--
-- Schemas Supabase manages itself (auth, storage internals, realtime, vault,
-- graphql) and the rows inside these tables. The on_auth_user_created trigger
-- points OUT of this file into auth.users, so auth must exist first — on a
-- Supabase project it always does. Table/sequence/function grants are not
-- listed because every one matches Supabase's default privileges for the
-- public schema; the one exception (handle_new_user) is explicit below.
--
-- The posts/post_media/post_queue policies are a team email allowlist — the
-- real access control for the library UI. Change them with a migration, and
-- regenerate.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extensions
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- 2. Enum types
-- -----------------------------------------------------------------------------

CREATE TYPE public."ConnectionType" AS ENUM ('api_key', 'mcp_url');
CREATE TYPE public."DeviceType" AS ENUM ('IOS', 'ANDROID', 'DESKTOP', 'OTHER');
CREATE TYPE public."NFCColor" AS ENUM ('MATTE_BLACK', 'BRUSHED_GOLD', 'STERLING_SILVER');
CREATE TYPE public."NFCOrderStatus" AS ENUM ('ORDERED', 'PAID', 'PRINTED', 'SHIPPED', 'ACTIVE');
CREATE TYPE public."NFCRedirectType" AS ENUM ('INSTAGRAM', 'LINK_IN_BIO', 'CUSTOM_URL', 'WHATSAPP_CHAT');
CREATE TYPE public."OmniSocialStatus" AS ENUM ('UNCONFIGURED', 'ACTIVE', 'INVALID');
CREATE TYPE public."Plan" AS ENUM ('FREE', 'PRO');
CREATE TYPE public."Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');
CREATE TYPE public."WhatsAppStatus" AS ENUM ('QUEUED', 'SENDING', 'PUBLISHED', 'FAILED');

-- -----------------------------------------------------------------------------
-- 3. Tables
-- -----------------------------------------------------------------------------

CREATE TABLE public."AgentConfig" (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  "userId" text NOT NULL,
  "llmProvider" text DEFAULT 'openai'::text,
  "llmApiKeyEncrypted" text,
  "twilioAccountSid" text,
  "twilioAuthTokenEncrypted" text,
  "twilioWhatsappNumber" text,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now(),
  "agentFramework" text DEFAULT 'openclaw'::text NOT NULL,
  "hermesEndpointUrl" text,
  "hermesApiKeyEncrypted" text,
  "higgsfieldApiKeyEncrypted" text
);

CREATE TABLE public."AgentLog" (
  id text DEFAULT (gen_random_uuid())::text NOT NULL,
  "userId" text NOT NULL,
  source text DEFAULT 'web'::text,
  intent text,
  "toolCalls" jsonb,
  result text,
  status text DEFAULT 'completed'::text,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."CompetitorWatch" (
  id text NOT NULL,
  "userId" text NOT NULL,
  "brandName" text NOT NULL,
  "handleInstagram" text,
  "handleYoutube" text,
  "handleTiktok" text,
  "handleX" text,
  "handleLinkedin" text,
  "followersCount" integer DEFAULT 0 NOT NULL,
  "avgEngagementRate" double precision DEFAULT 0 NOT NULL,
  "postingFrequencyWeekly" integer DEFAULT 0 NOT NULL,
  "lastScrapedAt" timestamp(3) without time zone,
  "audienceSentiment" public."Sentiment" DEFAULT 'NEUTRAL'::public."Sentiment" NOT NULL,
  "activeAdCampaignsCount" integer DEFAULT 0 NOT NULL,
  "estimatedAdSpendMonthly" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public."NFCCard" (
  id text NOT NULL,
  "userId" text NOT NULL,
  "cardSlug" text NOT NULL,
  "cardName" text NOT NULL,
  color public."NFCColor" DEFAULT 'MATTE_BLACK'::public."NFCColor" NOT NULL,
  "redirectType" public."NFCRedirectType" DEFAULT 'INSTAGRAM'::public."NFCRedirectType" NOT NULL,
  "destinationUrl" text NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "orderStatus" public."NFCOrderStatus" DEFAULT 'ORDERED'::public."NFCOrderStatus" NOT NULL,
  "flwTransactionId" text,
  "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "activationCode" text,
  "isActivated" boolean DEFAULT false NOT NULL,
  "profileSlug" text,
  "txRef" text
);

CREATE TABLE public."NFCLink" (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  "profileId" uuid NOT NULL,
  type text NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  "linkOrder" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."NFCProfile" (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  "cardId" text NOT NULL,
  "displayName" text NOT NULL,
  bio text,
  "avatarUrl" text,
  theme text DEFAULT 'default'::text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."NFCTapEvent" (
  id text NOT NULL,
  "cardId" text NOT NULL,
  "tappedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "deviceType" public."DeviceType" DEFAULT 'OTHER'::public."DeviceType" NOT NULL,
  city text,
  country text,
  latitude double precision,
  longitude double precision
);

CREATE TABLE public."OmniSocialConfig" (
  id text NOT NULL,
  "userId" text NOT NULL,
  "apiKeyEncrypted" text NOT NULL,
  "lastSyncedAt" timestamp(3) without time zone,
  status public."OmniSocialStatus" DEFAULT 'UNCONFIGURED'::public."OmniSocialStatus" NOT NULL,
  "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "connectionType" public."ConnectionType" DEFAULT 'api_key'::public."ConnectionType" NOT NULL,
  "mcpUrl" text
);

CREATE TABLE public."User" (
  id text NOT NULL,
  email text NOT NULL,
  name text,
  image text,
  plan public."Plan" DEFAULT 'FREE'::public."Plan" NOT NULL,
  "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public."WhatsAppBillboardCampaign" (
  id text NOT NULL,
  "userId" text NOT NULL,
  "campaignName" text NOT NULL,
  "mediaUrl" text NOT NULL,
  caption text,
  "redirectUrl" text,
  "scheduledAt" timestamp(3) without time zone NOT NULL,
  status public."WhatsAppStatus" DEFAULT 'QUEUED'::public."WhatsAppStatus" NOT NULL,
  errors text,
  "viewsCount" integer DEFAULT 0 NOT NULL,
  "clicksCount" integer DEFAULT 0 NOT NULL,
  "repliesCount" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.caption_profiles (
  id bigint GENERATED ALWAYS AS IDENTITY,
  org_id uuid,
  mode text DEFAULT 'keep'::text NOT NULL,
  contact_details text DEFAULT ''::text NOT NULL,
  price_text text DEFAULT ''::text NOT NULL,
  shop_location text DEFAULT ''::text NOT NULL,
  caption_template text DEFAULT ''::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  ig_handle text DEFAULT ''::text NOT NULL,
  hashtags_keep text DEFAULT '#feetbit'::text NOT NULL,
  hashtag_add text DEFAULT ''::text NOT NULL
);

CREATE TABLE public.gbp_queue (
  id bigint GENERATED ALWAYS AS IDENTITY,
  source_post_id bigint,
  scheduled_date date NOT NULL,
  headline text NOT NULL,
  body text NOT NULL,
  cta_type text NOT NULL,
  cta_url text,
  image_url text NOT NULL,
  status text DEFAULT 'pending_approval'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  approved_at timestamp with time zone,
  posted_at timestamp with time zone,
  needs_photo_review boolean DEFAULT true,
  photo_note text
);

CREATE TABLE public.post_media (
  id bigint GENERATED ALWAYS AS IDENTITY,
  post_id bigint NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  is_video boolean DEFAULT false NOT NULL,
  original_path text,
  embedding extensions.vector(512),
  uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
  org_id uuid
);

CREATE TABLE public.post_queue (
  id bigint GENERATED ALWAYS AS IDENTITY,
  post_id bigint NOT NULL,
  target_id bigint NOT NULL,
  rewritten_caption text,
  scheduled_at timestamp with time zone,
  published_at timestamp with time zone,
  publish_status text DEFAULT 'draft'::text NOT NULL,
  error_message text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  org_id uuid,
  tiktok_post_mode text,
  tiktok_publish_id text,
  post_url text,
  tiktok_music_sound_id text,
  tiktok_music_name text,
  tiktok_sound_id text,
  tiktok_sound_name text
);

CREATE TABLE public.posts (
  id bigint GENERATED ALWAYS AS IDENTITY,
  instagram_id text,
  caption text DEFAULT ''::text NOT NULL,
  owner_name text NOT NULL,
  owner_id text,
  created_time bigint NOT NULL,
  is_carousel boolean DEFAULT false NOT NULL,
  media_count integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  brand text,
  model text,
  imported_at timestamp with time zone DEFAULT now() NOT NULL,
  org_id uuid
);

CREATE TABLE public.target_accounts (
  id bigint GENERATED ALWAYS AS IDENTITY,
  ig_user_id text,
  ig_username text,
  page_id text,
  access_token text,
  token_expires timestamp with time zone,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  composio_account_id text,
  org_id uuid,
  is_ingest_source boolean DEFAULT false NOT NULL,
  platform text DEFAULT 'instagram'::text NOT NULL,
  tiktok_open_id text,
  tiktok_username text,
  higgsfield_connector_id uuid
);

CREATE TABLE public.video_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  series_id uuid,
  title text NOT NULL,
  topic text,
  status text DEFAULT 'idea'::text NOT NULL,
  priority smallint DEFAULT 100 NOT NULL,
  research_md text,
  script_md text,
  scene_manifest jsonb,
  timing_sheet jsonb,
  vo_path text,
  video_path text,
  thumb_path text,
  description_md text,
  keywords text[],
  render_id text,
  youtube_id text,
  scheduled_for timestamp with time zone,
  published_at timestamp with time zone,
  error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.video_series (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  day_of_week smallint,
  title_mold text NOT NULL,
  item_count smallint DEFAULT 15 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- -----------------------------------------------------------------------------
-- 4. Primary keys and unique constraints
-- -----------------------------------------------------------------------------

ALTER TABLE public."AgentConfig" ADD CONSTRAINT "AgentConfig_pkey" PRIMARY KEY (id);
ALTER TABLE public."AgentLog" ADD CONSTRAINT "AgentLog_pkey" PRIMARY KEY (id);
ALTER TABLE public."CompetitorWatch" ADD CONSTRAINT "CompetitorWatch_pkey" PRIMARY KEY (id);
ALTER TABLE public."NFCCard" ADD CONSTRAINT "NFCCard_pkey" PRIMARY KEY (id);
ALTER TABLE public."NFCLink" ADD CONSTRAINT "NFCLink_pkey" PRIMARY KEY (id);
ALTER TABLE public."NFCProfile" ADD CONSTRAINT "NFCProfile_pkey" PRIMARY KEY (id);
ALTER TABLE public."NFCTapEvent" ADD CONSTRAINT "NFCTapEvent_pkey" PRIMARY KEY (id);
ALTER TABLE public."OmniSocialConfig" ADD CONSTRAINT "OmniSocialConfig_pkey" PRIMARY KEY (id);
ALTER TABLE public."User" ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
ALTER TABLE public."WhatsAppBillboardCampaign" ADD CONSTRAINT "WhatsAppBillboardCampaign_pkey" PRIMARY KEY (id);
ALTER TABLE public.caption_profiles ADD CONSTRAINT caption_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.gbp_queue ADD CONSTRAINT gbp_queue_pkey PRIMARY KEY (id);
ALTER TABLE public.post_media ADD CONSTRAINT post_media_pkey PRIMARY KEY (id);
ALTER TABLE public.post_queue ADD CONSTRAINT post_queue_pkey PRIMARY KEY (id);
ALTER TABLE public.posts ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
ALTER TABLE public.target_accounts ADD CONSTRAINT target_accounts_pkey PRIMARY KEY (id);
ALTER TABLE public.video_queue ADD CONSTRAINT video_queue_pkey PRIMARY KEY (id);
ALTER TABLE public.video_series ADD CONSTRAINT video_series_pkey PRIMARY KEY (id);
ALTER TABLE public."AgentConfig" ADD CONSTRAINT "AgentConfig_userId_key" UNIQUE ("userId");
ALTER TABLE public."NFCCard" ADD CONSTRAINT "NFCCard_activationCode_key" UNIQUE ("activationCode");
ALTER TABLE public."NFCCard" ADD CONSTRAINT "NFCCard_profileSlug_key" UNIQUE ("profileSlug");
ALTER TABLE public."NFCProfile" ADD CONSTRAINT "NFCProfile_cardId_key" UNIQUE ("cardId");
ALTER TABLE public.caption_profiles ADD CONSTRAINT caption_profiles_org_id_key UNIQUE (org_id);
ALTER TABLE public.posts ADD CONSTRAINT posts_instagram_id_key UNIQUE (instagram_id);
ALTER TABLE public.target_accounts ADD CONSTRAINT target_accounts_ig_user_id_key UNIQUE (ig_user_id);
ALTER TABLE public.video_series ADD CONSTRAINT video_series_name_key UNIQUE (name);

-- -----------------------------------------------------------------------------
-- 5. Check constraints
-- -----------------------------------------------------------------------------

ALTER TABLE public."AgentConfig" ADD CONSTRAINT chk_agent_framework CHECK (("agentFramework" = ANY (ARRAY['openclaw'::text, 'hermes'::text])));
ALTER TABLE public."NFCLink" ADD CONSTRAINT chk_link_type CHECK ((type = ANY (ARRAY['instagram'::text, 'whatsapp'::text, 'google_review'::text, 'phone'::text, 'email'::text, 'website'::text, 'maps'::text, 'shop'::text, 'booking'::text, 'youtube'::text, 'twitter'::text, 'linkedin'::text, 'facebook'::text, 'custom'::text])));
ALTER TABLE public.caption_profiles ADD CONSTRAINT caption_profiles_mode_check CHECK ((mode = ANY (ARRAY['keep'::text, 'customize'::text])));
ALTER TABLE public.post_queue ADD CONSTRAINT post_queue_publish_status_check CHECK ((publish_status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'publishing'::text, 'published'::text, 'failed'::text])));
ALTER TABLE public.post_queue ADD CONSTRAINT post_queue_tiktok_post_mode_check CHECK ((tiktok_post_mode = ANY (ARRAY['direct'::text, 'inbox'::text])));
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'queued'::text, 'published'::text])));
ALTER TABLE public.target_accounts ADD CONSTRAINT target_accounts_platform_check CHECK ((platform = ANY (ARRAY['instagram'::text, 'tiktok'::text, 'x'::text])));
ALTER TABLE public.video_queue ADD CONSTRAINT video_queue_status_check CHECK ((status = ANY (ARRAY['idea'::text, 'researched'::text, 'scripted'::text, 'voiced'::text, 'rendered'::text, 'packaged'::text, 'published'::text, 'failed'::text])));
ALTER TABLE public.video_series ADD CONSTRAINT video_series_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)));

-- -----------------------------------------------------------------------------
-- 6. Foreign keys
-- -----------------------------------------------------------------------------

ALTER TABLE public."AgentConfig" ADD CONSTRAINT "AgentConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE public."AgentLog" ADD CONSTRAINT "AgentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;
ALTER TABLE public."CompetitorWatch" ADD CONSTRAINT "CompetitorWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public."NFCCard" ADD CONSTRAINT "NFCCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public."NFCLink" ADD CONSTRAINT "NFCLink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public."NFCProfile"(id) ON DELETE CASCADE;
ALTER TABLE public."NFCProfile" ADD CONSTRAINT "NFCProfile_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public."NFCCard"(id) ON DELETE CASCADE;
ALTER TABLE public."NFCTapEvent" ADD CONSTRAINT "NFCTapEvent_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public."NFCCard"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public."OmniSocialConfig" ADD CONSTRAINT "OmniSocialConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public."WhatsAppBillboardCampaign" ADD CONSTRAINT "WhatsAppBillboardCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.gbp_queue ADD CONSTRAINT gbp_queue_source_post_id_fkey FOREIGN KEY (source_post_id) REFERENCES public.posts(id);
ALTER TABLE public.post_media ADD CONSTRAINT post_media_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE public.post_queue ADD CONSTRAINT post_queue_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE public.post_queue ADD CONSTRAINT post_queue_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.target_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.video_queue ADD CONSTRAINT video_queue_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.video_series(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 7. Indexes
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX "NFCCard_cardSlug_key" ON public."NFCCard" USING btree ("cardSlug");
CREATE INDEX idx_nfc_card_activation_code ON public."NFCCard" USING btree ("activationCode");
CREATE INDEX idx_nfc_card_profile_slug ON public."NFCCard" USING btree ("profileSlug");
CREATE UNIQUE INDEX uq_nfc_cards_tx_ref ON public."NFCCard" USING btree ("txRef") WHERE ("txRef" IS NOT NULL);
CREATE INDEX idx_nfc_link_profile_id ON public."NFCLink" USING btree ("profileId");
CREATE INDEX idx_nfc_profile_card_id ON public."NFCProfile" USING btree ("cardId");
CREATE UNIQUE INDEX "OmniSocialConfig_userId_key" ON public."OmniSocialConfig" USING btree ("userId");
CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);
CREATE INDEX idx_post_media_embedding ON public.post_media USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists='100');
CREATE INDEX idx_post_media_post ON public.post_media USING btree (post_id);
CREATE INDEX idx_post_media_post_position ON public.post_media USING btree (post_id, "position") WHERE (public_url IS NOT NULL);
CREATE INDEX idx_post_queue_post_target_status ON public.post_queue USING btree (post_id, target_id, publish_status);
CREATE INDEX idx_post_queue_scheduled ON public.post_queue USING btree (scheduled_at) WHERE (publish_status = 'scheduled'::text);
CREATE INDEX idx_post_queue_status ON public.post_queue USING btree (publish_status);
CREATE INDEX idx_post_queue_target_sound_published ON public.post_queue USING btree (target_id, published_at DESC) WHERE (tiktok_sound_id IS NOT NULL);
CREATE INDEX post_queue_target_music_recent_idx ON public.post_queue USING btree (target_id, published_at DESC) WHERE (tiktok_music_sound_id IS NOT NULL);
CREATE INDEX idx_posts_owner ON public.posts USING btree (owner_name);
CREATE INDEX idx_posts_owner_status_created ON public.posts USING btree (owner_name, status, created_time);
CREATE INDEX idx_posts_status ON public.posts USING btree (status);
CREATE INDEX video_queue_sched_idx ON public.video_queue USING btree (scheduled_for) WHERE (status = 'packaged'::text);
CREATE INDEX video_queue_series_idx ON public.video_queue USING btree (series_id);
CREATE INDEX video_queue_status_idx ON public.video_queue USING btree (status, priority, created_at);

-- -----------------------------------------------------------------------------
-- 8. Functions
-- -----------------------------------------------------------------------------

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

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

CREATE OR REPLACE FUNCTION public.match_post_media(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.8, match_count integer DEFAULT 10)
 RETURNS TABLE(media_id bigint, post_id bigint, storage_path text, public_url text, similarity double precision)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  select
    pm.id as media_id,
    pm.post_id,
    pm.storage_path,
    pm.public_url,
    1 - (pm.embedding <=> query_embedding) as similarity
  from post_media pm
  where pm.embedding is not null
    and 1 - (pm.embedding <=> query_embedding) > match_threshold
  order by pm.embedding <=> query_embedding
  limit match_count;
$function$;

CREATE OR REPLACE FUNCTION public.touch_video_queue_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin new.updated_at = now(); return new; end $function$;


-- -----------------------------------------------------------------------------
-- 9. Triggers
-- -----------------------------------------------------------------------------

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER video_queue_touch BEFORE UPDATE ON public.video_queue FOR EACH ROW EXECUTE FUNCTION public.touch_video_queue_updated_at();

-- -----------------------------------------------------------------------------
-- 10. Row level security
-- -----------------------------------------------------------------------------

ALTER TABLE public."AgentConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AgentLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CompetitorWatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NFCCard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NFCLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NFCProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NFCTapEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OmniSocialConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WhatsAppBillboardCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caption_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_config_owner ON public."AgentConfig" AS PERMISSIVE FOR ALL TO public
  USING (("userId" = (auth.uid())::text));
CREATE POLICY agent_log_owner ON public."AgentLog" AS PERMISSIVE FOR ALL TO public
  USING (("userId" = (auth.uid())::text));
CREATE POLICY "Users can delete own competitors" ON public."CompetitorWatch" AS PERMISSIVE FOR DELETE TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Users can insert own competitors" ON public."CompetitorWatch" AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((auth.uid())::text = "userId"));
CREATE POLICY "Users can read own competitors" ON public."CompetitorWatch" AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Users can update own competitors" ON public."CompetitorWatch" AS PERMISSIVE FOR UPDATE TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Users can delete own nfc cards" ON public."NFCCard" AS PERMISSIVE FOR DELETE TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Users can insert own nfc cards" ON public."NFCCard" AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((auth.uid())::text = "userId"));
CREATE POLICY "Users can read own nfc cards" ON public."NFCCard" AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Users can update own nfc cards" ON public."NFCCard" AS PERMISSIVE FOR UPDATE TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Public read active links" ON public."NFCLink" AS PERMISSIVE FOR SELECT TO public
  USING (("profileId" IN ( SELECT "NFCProfile".id
   FROM (public."NFCProfile"
     JOIN public."NFCCard" ON (("NFCProfile"."cardId" = "NFCCard".id)))
  WHERE (("NFCCard"."isActivated" = true) AND ("NFCCard"."profileSlug" IS NOT NULL)))));
CREATE POLICY "Users can delete their own links" ON public."NFCLink" AS PERMISSIVE FOR DELETE TO public
  USING (("profileId" IN ( SELECT "NFCProfile".id
   FROM (public."NFCProfile"
     JOIN public."NFCCard" ON (("NFCProfile"."cardId" = "NFCCard".id)))
  WHERE ("NFCCard"."userId" = (auth.uid())::text))));
CREATE POLICY "Users can insert their own links" ON public."NFCLink" AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (("profileId" IN ( SELECT "NFCProfile".id
   FROM (public."NFCProfile"
     JOIN public."NFCCard" ON (("NFCProfile"."cardId" = "NFCCard".id)))
  WHERE ("NFCCard"."userId" = (auth.uid())::text))));
CREATE POLICY "Users can update their own links" ON public."NFCLink" AS PERMISSIVE FOR UPDATE TO public
  USING (("profileId" IN ( SELECT "NFCProfile".id
   FROM (public."NFCProfile"
     JOIN public."NFCCard" ON (("NFCProfile"."cardId" = "NFCCard".id)))
  WHERE ("NFCCard"."userId" = (auth.uid())::text))));
CREATE POLICY "Users can view their own links" ON public."NFCLink" AS PERMISSIVE FOR SELECT TO public
  USING (("profileId" IN ( SELECT "NFCProfile".id
   FROM (public."NFCProfile"
     JOIN public."NFCCard" ON (("NFCProfile"."cardId" = "NFCCard".id)))
  WHERE ("NFCCard"."userId" = (auth.uid())::text))));
CREATE POLICY "Public read active profiles" ON public."NFCProfile" AS PERMISSIVE FOR SELECT TO public
  USING (("cardId" IN ( SELECT "NFCCard".id
   FROM public."NFCCard"
  WHERE (("NFCCard"."isActivated" = true) AND ("NFCCard"."profileSlug" IS NOT NULL)))));
CREATE POLICY "Users can delete their own profiles" ON public."NFCProfile" AS PERMISSIVE FOR DELETE TO public
  USING (("cardId" IN ( SELECT "NFCCard".id
   FROM public."NFCCard"
  WHERE ("NFCCard"."userId" = (auth.uid())::text))));
CREATE POLICY "Users can insert their own profiles" ON public."NFCProfile" AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (("cardId" IN ( SELECT "NFCCard".id
   FROM public."NFCCard"
  WHERE ("NFCCard"."userId" = (auth.uid())::text))));
CREATE POLICY "Users can update their own profiles" ON public."NFCProfile" AS PERMISSIVE FOR UPDATE TO public
  USING (("cardId" IN ( SELECT "NFCCard".id
   FROM public."NFCCard"
  WHERE ("NFCCard"."userId" = (auth.uid())::text))));
CREATE POLICY "Users can view their own profiles" ON public."NFCProfile" AS PERMISSIVE FOR SELECT TO public
  USING (("cardId" IN ( SELECT "NFCCard".id
   FROM public."NFCCard"
  WHERE ("NFCCard"."userId" = (auth.uid())::text))));
CREATE POLICY "Users can view their own tap events" ON public."NFCTapEvent" AS PERMISSIVE FOR SELECT TO public
  USING (("cardId" IN ( SELECT "NFCCard".id
   FROM public."NFCCard"
  WHERE ("NFCCard"."userId" = (auth.uid())::text))));
CREATE POLICY "Users can delete own config" ON public."OmniSocialConfig" AS PERMISSIVE FOR DELETE TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Users can insert own config" ON public."OmniSocialConfig" AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((auth.uid())::text = "userId"));
CREATE POLICY "Users can read own config" ON public."OmniSocialConfig" AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Users can update own config" ON public."OmniSocialConfig" AS PERMISSIVE FOR UPDATE TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Users can insert own profile" ON public."User" AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((auth.uid())::text = id));
CREATE POLICY "Users can read own profile" ON public."User" AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid())::text = id));
CREATE POLICY "Users can update own profile" ON public."User" AS PERMISSIVE FOR UPDATE TO public
  USING (((auth.uid())::text = id));
CREATE POLICY "Users can delete own whatsapp campaigns" ON public."WhatsAppBillboardCampaign" AS PERMISSIVE FOR DELETE TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Users can insert own whatsapp campaigns" ON public."WhatsAppBillboardCampaign" AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((auth.uid())::text = "userId"));
CREATE POLICY "Users can read own whatsapp campaigns" ON public."WhatsAppBillboardCampaign" AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Users can update own whatsapp campaigns" ON public."WhatsAppBillboardCampaign" AS PERMISSIVE FOR UPDATE TO public
  USING (((auth.uid())::text = "userId"));
CREATE POLICY "Authenticated access" ON public.caption_profiles AS PERMISSIVE FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Team allowlist access" ON public.post_media AS PERMISSIVE FOR ALL TO authenticated
  USING (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['feetbitten@gmail.com'::text, 'angellokin@gmail.com'::text, 'feetbitdata@gmail.com'::text, 'gaetanoshoes256@gmail.com'::text, 'socksy.shopping@gmail.com'::text, 'personxproject@gmail.com'::text])))
  WITH CHECK (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['feetbitten@gmail.com'::text, 'angellokin@gmail.com'::text, 'feetbitdata@gmail.com'::text, 'gaetanoshoes256@gmail.com'::text, 'socksy.shopping@gmail.com'::text, 'personxproject@gmail.com'::text])));
CREATE POLICY "Team allowlist access" ON public.post_queue AS PERMISSIVE FOR ALL TO authenticated
  USING (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['feetbitten@gmail.com'::text, 'angellokin@gmail.com'::text, 'feetbitdata@gmail.com'::text, 'gaetanoshoes256@gmail.com'::text, 'socksy.shopping@gmail.com'::text, 'personxproject@gmail.com'::text])))
  WITH CHECK (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['feetbitten@gmail.com'::text, 'angellokin@gmail.com'::text, 'feetbitdata@gmail.com'::text, 'gaetanoshoes256@gmail.com'::text, 'socksy.shopping@gmail.com'::text, 'personxproject@gmail.com'::text])));
CREATE POLICY "Team allowlist access" ON public.posts AS PERMISSIVE FOR ALL TO authenticated
  USING (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['feetbitten@gmail.com'::text, 'angellokin@gmail.com'::text, 'feetbitdata@gmail.com'::text, 'gaetanoshoes256@gmail.com'::text, 'socksy.shopping@gmail.com'::text, 'personxproject@gmail.com'::text])))
  WITH CHECK (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['feetbitten@gmail.com'::text, 'angellokin@gmail.com'::text, 'feetbitdata@gmail.com'::text, 'gaetanoshoes256@gmail.com'::text, 'socksy.shopping@gmail.com'::text, 'personxproject@gmail.com'::text])));
CREATE POLICY "Authenticated access" ON public.target_accounts AS PERMISSIVE FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY video_queue_service ON public.video_queue AS PERMISSIVE FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
CREATE POLICY video_series_service ON public.video_series AS PERMISSIVE FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 11. Storage buckets and policies
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('ai-agent-media', 'ai-agent-media', true, NULL, '{image/jpeg,image/png,image/webp}'::text[]) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('carousel-exports', 'carousel-exports', true, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('kickshot', 'kickshot', true, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('nfc-avatars', 'nfc-avatars', true, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('post-media', 'post-media', true, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('reels', 'reels', true, 104857600, '{video/mp4}'::text[]) ON CONFLICT (id) DO NOTHING;
CREATE POLICY carousel_exports_anon_update ON storage.objects AS PERMISSIVE FOR UPDATE TO anon
  USING ((bucket_id = 'carousel-exports'::text))
  WITH CHECK ((bucket_id = 'carousel-exports'::text));
CREATE POLICY carousel_exports_anon_write ON storage.objects AS PERMISSIVE FOR INSERT TO anon
  WITH CHECK ((bucket_id = 'carousel-exports'::text));
CREATE POLICY carousel_exports_public_read ON storage.objects AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING ((bucket_id = 'carousel-exports'::text));
