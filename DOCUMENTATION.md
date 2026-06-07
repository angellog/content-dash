# ContentDash Technical Documentation

## Overview

ContentDash is an AI-powered content management dashboard built with Next.js 16, Supabase, and OmniSocial. It enables social media management across 10 platforms, AI agent automation (OpenClaw/Hermes), NFC card management, WhatsApp billboard campaigns, and competitor tracking.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ContentDash                          │
│                     Next.js 16 (App Router)                  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Dashboard │  │  Social  │  │Analytics │  │ Calendar │   │
│  └──────────┘  │ Manager  │  └──────────┘  └──────────┘   │
│  ┌──────────┐  └──────────┘  ┌──────────┐  ┌──────────┐   │
│  │Competitor│  ┌──────────┐  │  News    │  │ WhatsApp │   │
│  │  Watch   │  │NFC Cards │  │  Feed    │  │ Billboard│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐                                │
│  │ OpenClaw │  │ Settings │                                │
│  │  Agent   │  │          │                                │
│  └──────────┘  └──────────┘                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    API Layer                         │   │
│  │  /api/agent/*   /api/omnisocial/*   /api/payments   │   │
│  │  /api/competitors  /api/nfc/*  /api/whatsapp/*      │   │
│  │  /api/news  /api/analytics  /api/auth/*              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Agent Dispatch │  │   Rate Limiter  │  │  Encryption   │  │
│  │ OpenClaw/Hermes│  │ Sliding Window  │  │  AES-256-GCM  │  │
│  └───────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌───────────────┐  ┌─────────────────┐
│    Supabase     │  │  OmniSocial   │  │  Self-Hosted    │
│  Auth + DB +    │  │  API          │  │  Hermes LLM     │
│  Edge Functions │  │  (Social,     │  │  (vLLM/Ollama/  │
│                 │  │   Analytics)  │  │   LM Studio)    │
└─────────────────┘  └───────────────┘  └─────────────────┘
```

---

## Agent Framework Architecture

ContentDash supports two agent frameworks, selectable per-user in Settings:

### OpenClaw (Cloud LLM APIs)

```
User Command → /api/agent/execute
                    │
                    ▼
            ┌───────────────┐
            │  AgentConfig   │── agentFramework = "openclaw"
            └───────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   callLLM()   │── OpenAI / Anthropic / Gemini
            └───────────────┘
                    │
            ┌───────┴───────┐
            │  Tool Loop     │  (max 8 iterations)
            │  1. Call LLM   │
            │  2. Parse tools│
            │  3. Execute    │
            │  4. Feed back  │
            └───────┬───────┘
                    │
                    ▼
            AgentLog → Supabase
```

### Hermes (Self-Hosted LLM)

```
User Command → /api/agent/execute
                    │
                    ▼
            ┌───────────────┐
            │  AgentConfig   │── agentFramework = "hermes"
            └───────────────┘
                    │
                    ▼
            ┌───────────────────┐
            │ callHermesAgent() │── User's vLLM/Ollama endpoint
            └───────────────────┘
                    │
            ┌───────┴───────┐
            │  ChatML Format │
            │  <tools> XML   │
            │  <scratch_pad> │
            │  tool_call> XML│
            └───────┬───────┘
                    │
            ┌───────┴───────┐
            │  Same Tool Loop│  (max 8 iterations, same 6 tools)
            └───────┬───────┘
                    │
                    ▼
            AgentLog → Supabase
```

**Both frameworks share:**
- Same 6 tools: `fetch_news`, `post_to_omnisocial`, `create_whatsapp_campaign`, `add_competitor`, `get_analytics`, `manage_nfc_card`
- Same tool executor (`src/app/api/agent/executor.ts`)
- Same logging to `AgentLog` table
- Same rate limiting (10 req/min)
- Same WhatsApp webhook dispatch

---

## Hermes ChatML Protocol

The Hermes integration follows the [NousResearch Hermes-Function-Calling](https://github.com/NousResearch/Hermes-Function-Calling) specification.

### System Prompt Structure

```
You are a function calling AI model. You are provided with function signatures
within <tools></tools> XML tags. You may call one or more functions to assist
with the user query. If available tools are not relevant in assisting with user
query, just respond in natural conversational language. Don't make assumptions
about what values to plug into functions. After calling & executing the functions,
you will be provided with function results within <tool_response>
</tool_response> XML tags.

<tools>
[{"type": "function", "function": {"name": "fetch_news", "description": "...", "parameters": {...}}}]
</tools>

For each function call return a JSON object, with the following pydantic model json schema:
{"title": "FunctionCall", "type": "object", "properties": {"name": {"title": "Name", "type": "string"}, "arguments": {"title": "Arguments", "type": "object"}}, "required": ["name", "arguments"]}
Each function call should be enclosed within <tool_call> </tool_call> XML tags.
You must use <scratch_pad> </scratch_pad> XML tags to record your reasoning and planning.
```

### Message Format (ChatML)

| Role | Format |
|------|--------|
| System | `{ role: "system", content: "<tools>...</tools>..." }` |
| User | `{ role: "user", content: "message" }` |
| Assistant (text only) | `{ role: "assistant", content: "response text" }` |
| Assistant (tool call) | `{ role: "assistant", content: "<scratch_pad>...</scratch_pad>\n<tool_call>\n{\"name\":\"fn\",\"arguments\":{...}}\n</tool_call>" }` |
| Tool result | `{ role: "tool", content: "<tool_response>\n{\"name\":\"fn\",\"content\":\"result\"}\n</tool_response>" }` |

### Response Parsing

The `parseHermesResponse()` function in `src/lib/llm.ts` extracts:

1. **Tool calls**: regex `/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g` — each match is parsed as JSON `{name, arguments}` and converted to `ToolCall` with a generated `hermes-` prefixed ID
2. **Text content**: the response with `<scratch_pad>` blocks and `<tool_call>` blocks stripped
3. **Finish reason**: `"tool_calls"` if any tool calls found, `"stop"` otherwise

---

## Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `AgentConfig` | Per-user agent settings | `userId`, `agentFramework`, `llmProvider`, `llmApiKeyEncrypted`, `hermesEndpointUrl`, `hermesApiKeyEncrypted`, `twilioAccountSid`, `twilioAuthTokenEncrypted`, `twilioWhatsappNumber`, `isActive` |
| `AgentLog` | Agent execution history | `userId`, `source` (web/whatsapp/api), `intent`, `toolCalls`, `result`, `status` (completed/failed/running) |
| `OmniSocialConfig` | OmniSocial connection | `userId`, `apiKeyEncrypted`, `status`, `connectionType`, `mcpUrl` |
| `CompetitorWatch` | Competitor tracking | `userId`, `brandName`, `handleInstagram`, `handleYoutube`, `handleTiktok`, `handleX`, `handleLinkedin` |
| `NFCCard` | NFC card configs | `userId`, `cardName`, `cardSlug`, `redirectType`, `destinationUrl`, `color`, `isActive` |
| `NFCTapEvent` | Tap analytics | `cardId`, `tappedAt` |
| `WhatsAppBillboardCampaign` | WhatsApp campaigns | `userId`, `campaignName`, `caption`, `mediaUrl`, `scheduledAt`, `status` |

### Enums

- `AgentLogStatus`: `completed`, `failed`, `running`
- `AgentLogSource`: `web`, `whatsapp`, `api`
- `AgentFramework`: `openclaw`, `hermes` (CHECK constraint)

### Indexes

- `idx_nfc_tap_events_card_id` on `NFCTapEvent(cardId)`
- `idx_nfc_tap_events_tapped_at` on `NFCTapEvent(tappedAt)`
- `idx_agent_logs_user_created` on `AgentLog(userId, createdAt)`
- `idx_competitor_watches_user_id` on `CompetitorWatch(userId)`
- `idx_whatsapp_campaigns_user_status` on `WhatsAppBillboardCampaign(userId, status)`
- `idx_nfc_cards_user_id` on `NFCCard(userId)`

### Constraints

- `uq_competitor_user_brand` UNIQUE on `CompetitorWatch(userId, brandName)`

---

## API Routes

### Agent Routes

| Method | Path | Purpose | Auth | Rate Limit |
|--------|------|---------|------|------------|
| POST | `/api/agent/execute` | Run agent with natural language command | Required | 10/min |
| POST | `/api/agent/whatsapp` | WhatsApp webhook (Twilio) | Twilio HMAC | — |
| GET | `/api/agent/config` | Get agent configuration | Required | — |
| PUT | `/api/agent/config` | Update agent configuration | Required | — |
| DELETE | `/api/agent/config` | Deactivate agent | Required | — |
| GET | `/api/agent/logs` | Get execution history | Required | — |

### OmniSocial Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/omnisocial/config` | Get connection status |
| PUT | `/api/omnisocial/config` | Save API key/MCP URL |
| DELETE | `/api/omnisocial/config` | Disconnect |
| GET | `/api/omnisocial/accounts` | List connected accounts |
| GET | `/api/omnisocial/posts` | List scheduled posts |
| POST | `/api/omnisocial/upload` | Upload media |
| DELETE | `/api/omnisocial/posts/[id]` | Delete a post |

### NFC Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/nfc/cards` | List user's NFC cards |
| POST | `/api/nfc/cards` | Create NFC card |
| PATCH | `/api/nfc/cards/[id]` | Update NFC card (strict) |
| DELETE | `/api/nfc/cards/[id]` | Delete NFC card |
| GET | `/api/nfc/tap/[slug]` | Redirect on NFC tap |

### Other Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/competitors` | List competitors |
| POST | `/api/competitors` | Add competitor |
| PATCH | `/api/competitors/[id]` | Update competitor |
| DELETE | `/api/competitors/[id]` | Remove competitor |
| POST | `/api/payments` | Initiate Flutterwave charge |
| POST | `/api/payments/webhook` | Flutterwave webhook |
| GET | `/api/analytics` | OmniSocial analytics |
| GET | `/api/news` | RSS news feed |
| GET | `/api/auth/callback` | Supabase OAuth callback |
| POST | `/api/whatsapp/campaigns` | Create WhatsApp campaign |
| DELETE | `/api/whatsapp/campaigns/[id]` | Delete WhatsApp campaign |

---

## Security

### Encryption

All sensitive keys are encrypted at rest using AES-256-GCM:

- **`llmApiKeyEncrypted`** — LLM provider API key (OpenAI/Anthropic/Gemini)
- **`hermesApiKeyEncrypted`** — Hermes endpoint API key (optional)
- **`twilioAuthTokenEncrypted`** — Twilio auth token
- **`apiKeyEncrypted`** (OmniSocialConfig) — OmniSocial API key

Key derivation uses `ENCRYPTION_SALT` env var (fallback: `contentdash-salt-v1`). Encryption failures throw — no fallback to plaintext.

### Webhook Validation

- **Twilio**: HMAC-SHA1 with `timingSafeEqual` for constant-time comparison
- **Flutterwave**: SHA256 hash with `timingSafeEqual`

### Rate Limiting

In-memory sliding window rate limiter (`src/lib/rate-limit.ts`):

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/agent/execute` | 10 requests | 60 seconds |
| `/api/payments` | 5 requests | 60 seconds |

Returns 429 with `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers.

### Multi-Tenancy

- All Supabase queries use `userId` from authenticated session
- WhatsApp webhook matches incoming number against `AgentConfig.twilioWhatsappNumber` to identify correct user
- All tool executions write `userId` to created rows
- RLS policies on all tables enforce user isolation

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `OMNISOCIAL_ENCRYPTION_KEY` | Yes | Master encryption key (min 16 chars) |
| `ENCRYPTION_SALT` | No | Encryption salt (default: `contentdash-salt-v1`) |
| `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` | Yes | Flutterwave public key |
| `FLW_SECRET_KEY` | Yes | Flutterwave secret key |
| `FLW_WEBHOOK_HASH` | Yes | Flutterwave webhook hash |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | No | Twilio WhatsApp number |
| `HERMES_DEFAULT_ENDPOINT_URL` | No | Default Hermes endpoint URL fallback |
| `NEXT_PUBLIC_APP_URL` | Yes | App public URL (for Twilio signature validation) |

---

## Testing

**55 tests across 5 files** using Vitest + jsdom:

| File | Tests | Coverage |
|------|-------|----------|
| `encryption.test.ts` | 6 | AES-256-GCM encrypt/decrypt, salt config, error handling |
| `schemas.test.ts` | 12 | All 8 Zod schemas, valid/invalid inputs, strict mode, enums |
| `rate-limit.test.ts` | 11 | Sliding window, limit enforcement, window reset, headers |
| `llm-formatting.test.ts` | 13 | OpenAI/Anthropic/Gemini message formatting, tool_calls, tool_results |
| `hermes.test.ts` | 13 | ChatML formatting, tool_call> XML parsing, endpoint handling, auth |

Run: `npm test` or `npm run test:watch`

---

## Key File Map

```
src/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   ├── config/route.ts          # Agent config CRUD (GET/PUT/DELETE)
│   │   │   ├── execute/route.ts         # Main agent execute endpoint
│   │   │   ├── executor.ts              # Tool implementations (6 tools)
│   │   │   ├── logs/route.ts            # Agent log history
│   │   │   ├── tools.ts                 # Tool definitions for LLM function calling
│   │   │   └── whatsapp/route.ts        # WhatsApp webhook
│   │   ├── analytics/route.ts
│   │   ├── auth/callback/route.ts
│   │   ├── competitors/
│   │   ├── nfc/
│   │   ├── news/route.ts
│   │   ├── omnisocial/
│   │   ├── payments/
│   │   └── whatsapp/
│   ├── openclaw/page.tsx                # Agent command center UI
│   ├── settings/page.tsx                # Settings with framework selector
│   └── ... (10 page routes)
├── components/
│   ├── layout/
│   │   ├── header.tsx
│   │   └── sidebar.tsx                  # Nav with OpenClaw link + connection status
│   └── ui/                              # Shadcn components
├── hooks/
│   └── useSocialMediaStore.ts           # Zustand store with API persistence
├── lib/
│   ├── encryption.ts                    # AES-256-GCM with configurable salt
│   ├── llm.ts                           # Multi-provider LLM client + callHermesAgent()
│   ├── rate-limit.ts                    # In-memory sliding window rate limiter
│   ├── supabase/
│   │   ├── client.ts                    # Browser Supabase client
│   │   └── server.ts                    # Server Supabase client
│   ├── utils.ts
│   ├── validations/
│   │   └── schemas.ts                   # All Zod validation schemas
│   └── __tests__/
│       ├── encryption.test.ts
│       ├── hermes.test.ts
│       ├── llm-formatting.test.ts
│       ├── rate-limit.test.ts
│       └── schemas.test.ts
├── types/
│   └── db.ts                            # Manual DB types (AgentConfig, AgentLog, etc.)
└── proxy.ts                             # Next.js 16 proxy (replaces middleware.ts)

supabase/
└── migrations/
    ├── 20260604_add_indexes_and_enums.sql
    └── 20260605_add_agent_framework.sql
```

---

## Deployment Checklist

### New Deployment

1. Set all required environment variables (see table above)
2. Run Supabase migrations: `npm run db:push` or apply SQL manually
3. Configure OmniSocial connection in Settings
4. Configure agent framework (OpenClaw: LLM provider + API key; Hermes: endpoint URL)
5. Optionally configure Twilio for WhatsApp integration

### Upgrading from v2.0.0 to v2.1.0

1. Apply migration: `supabase/migrations/20260605_add_agent_framework.sql`
2. Add `HERMES_DEFAULT_ENDPOINT_URL` to env if desired
3. Existing configs automatically default to `agentFramework = 'openclaw'` — no breaking changes
4. Users can switch to Hermes in Settings without any migration

### Encryption Salt Rotation

If upgrading from pre-v2.0.0 where `ENCRYPTION_SALT` was hardcoded:

1. Set `ENCRYPTION_SALT=contentdash-salt-v1` temporarily to decrypt existing data
2. Re-encrypt all keys through the Settings page (PUT `/api/agent/config` with new keys)
3. Change `ENCRYPTION_SALT` to a new random value
4. Re-save all keys through Settings again
