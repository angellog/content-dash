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

---

## Agent Framework Comparison

### Side-by-Side

| Aspect | OpenClaw | Hermes |
|--------|----------|--------|
| **Architecture** | Direct cloud LLM API calls | Self-hosted LLM via OpenAI-compatible endpoint |
| **LLM Providers** | OpenAI (GPT-4o), Anthropic (Claude Sonnet), Google (Gemini 2.0 Flash) | Any model served via vLLM/Ollama/LM Studio (NousResearch Hermes models recommended) |
| **Data Flow** | User → ContentDash → Cloud API → ContentDash → User | User → ContentDash → Your Server → ContentDash → User |
| **Cost** | Pay-per-token to LLM provider (OpenAI ~$5/1M tokens, Anthropic ~$3/1M tokens) | Free after hardware cost (self-hosted) or cloud GPU cost (~$0.20-$1.00/hr) |
| **Privacy** | Your prompts and tool results pass through a third-party API | All data stays on your infrastructure — nothing leaves your network |
| **Latency** | 1-3 seconds per LLM call (depends on provider and region) | 2-10 seconds per LLM call (depends on model size and GPU) |
| **Offline Support** | No — requires internet connection to LLM provider | Yes — works entirely on your local network |
| **Setup Complexity** | Low — just enter an API key | Medium — need to set up and run a model server |
| **Customization** | Limited to provider's model capabilities | Full control over model, system prompt, temperature, context length |
| **Minimum Hardware** | None (cloud) | GPU with 8GB+ VRAM for 8B models, 24GB+ for 70B models |
| **Recommended For** | Teams wanting quick setup, best-in-class reasoning, no infrastructure | Privacy-first teams, air-gapped environments, cost optimization at scale, model experimentation |
| **Tool Calling** | Native function calling API (OpenAI/Anthropic/Gemini format) | ChatML with `<tools>` XML + `tool_call>` XML tags (Hermes function-calling format) |
| **Reasoning** | Provider-dependent (chain-of-thought, etc.) | Built-in `<scratch_pad>` GOAP reasoning framework |
| **Rate Limits** | Subject to LLM provider rate limits + ContentDash 10/min | Only ContentDash 10/min (no external rate limits) |

### Benefits of OpenClaw

1. **Zero infrastructure** — just add an API key and go
2. **Best reasoning quality** — GPT-4o, Claude Sonnet, and Gemini are state-of-the-art
3. **Fastest time-to-value** — configure in under 2 minutes
4. **Multi-provider flexibility** — switch between OpenAI, Anthropic, and Gemini anytime
5. **No GPU required** — runs entirely in the cloud
6. **Automatic model updates** — providers continuously improve their models

### Benefits of Hermes

1. **Complete data privacy** — no prompts or results ever leave your server
2. **Zero per-token cost** — after hardware, inference is free
3. **Offline capability** — works without internet in air-gapped environments
4. **Full model control** — choose any model, adjust temperature, context length, sampling
5. **No vendor lock-in** — not dependent on any single LLM provider's pricing or availability
6. **GOAP reasoning** — built-in scratch pad for goal-oriented action planning
7. **Custom fine-tuning** — bring your own fine-tuned model for domain-specific tasks
8. **Predictable latency** — no shared infrastructure variability

### When to Use Which

| Scenario | Recommended Framework |
|----------|----------------------|
| Just getting started, want to try the agent | OpenClaw |
| Small team, low volume, don't want to manage servers | OpenClaw |
| Enterprise with data privacy requirements (GDPR, HIPAA) | Hermes |
| High volume (>10K agent requests/day), cost optimization | Hermes |
| Air-gapped or offline environment | Hermes |
| Want to experiment with custom/fine-tuned models | Hermes |
| Need best-in-class reasoning for complex tasks | OpenClaw |
| Startup with limited DevOps capacity | OpenClaw |
| Running in a regulated industry (finance, healthcare) | Hermes |
| Want predictable, flat monthly costs | Hermes |

---

## OpenClaw Configuration Guide

### Step 1: Choose Your LLM Provider

In **Settings → AI Agent Configuration**, select **"OpenClaw (Cloud LLM APIs)"** as the framework, then choose a provider:

| Provider | Model | Best For | Pricing (approx.) |
|----------|-------|----------|-------------------|
| OpenAI | GPT-4o | General-purpose, best reasoning | ~$5/1M input tokens |
| Anthropic | Claude Sonnet 4 | Nuanced writing, analysis | ~$3/1M input tokens |
| Google | Gemini 2.0 Flash | Speed, cost efficiency | ~$0.075/1M input tokens |

### Step 2: Get Your API Key

- **OpenAI**: https://platform.openai.com/api-keys → Create new secret key → Copy `sk-...`
- **Anthropic**: https://console.anthropic.com/settings/keys → Create key → Copy `sk-ant-...`
- **Google**: https://aistudio.google.com/apikey → Create API key → Copy `AIza...`

### Step 3: Enter in Settings

1. Navigate to **Settings** (gear icon in sidebar)
2. Under **AI Agent Configuration**, framework should be **OpenClaw**
3. Select your provider from the dropdown
4. Paste your API key in the **LLM API Key** field
5. Click **Save Agent Config**

### Step 4: Test

1. Navigate to **OpenClaw** in the sidebar
2. Type a command like: `"Post about AI trends on Instagram and Twitter"`
3. The agent will: fetch AI news → generate post content → publish to both platforms
4. Check the activity log for confirmation

---

## Hermes Configuration Guide

### Step 1: Choose Your Hosting Method

| Method | Difficulty | GPU Required | Best For |
|--------|-----------|--------------|----------|
| **Ollama** | Easy | Optional (CPU works, GPU faster) | Local development, quick setup |
| **vLLM** | Medium | Yes (8GB+ VRAM) | Production, high throughput |
| **LM Studio** | Easy | Optional (CPU works, GPU faster) | Desktop users, GUI preference |

### Step 2: Install and Start the Model Server

#### Option A: Ollama (Recommended for getting started)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the Hermes 3 model (8B parameters, ~5GB download)
ollama pull hermes3

# Start the server (runs on http://localhost:11434 by default)
ollama serve
```

The OpenAI-compatible endpoint will be available at: `http://localhost:11434/v1`

#### Option B: vLLM (Recommended for production)

```bash
# Install vLLM
pip install vllm

# Start the server with Hermes 3 model
python -m vllm.entrypoints.openai.api_server \
  --model NousResearch/Hermes-3-Llama-3.1-8B \
  --host 0.0.0.0 \
  --port 11434 \
  --max-model-len 4096
```

The OpenAI-compatible endpoint will be available at: `http://localhost:11434/v1`

For larger models (better quality, more GPU required):
- **70B model** (requires 4x A100 or 2x A6000): `--model NousResearch/Hermes-3-Llama-3.1-70B`
- **Quantized 8B** (runs on consumer GPUs): `--model NousResearch/Hermes-3-Llama-3.1-8B --quantization awq`

#### Option C: LM Studio (GUI)

1. Download LM Studio from https://lmstudio.ai
2. Open LM Studio, search for "Hermes 3" in the model browser
3. Download `Hermes 3 - Llama 3.1 8B` (or larger if your GPU supports it)
4. Go to the **Local Server** tab
5. Click **Start Server** — it runs on `http://localhost:1234/v1` by default
6. Ensure "OpenAI-compatible API" is enabled in settings

### Step 3: Configure in ContentDash Settings

1. Navigate to **Settings** (gear icon in sidebar)
2. Under **AI Agent Configuration**, select **"Hermes (Self-Hosted LLM)"** as the framework
3. Enter your **Hermes Endpoint URL**:
   - Ollama: `http://localhost:11434/v1`
   - vLLM: `http://localhost:11434/v1`
   - LM Studio: `http://localhost:1234/v1`
   - Remote server: `https://your-server.com/v1`
4. If your endpoint requires authentication, enter the API key in the optional **Hermes API Key** field
5. Click **Save Agent Config**

### Step 4: Test

1. Navigate to **OpenClaw** in the sidebar
2. Verify the **Hermes** framework badge is showing (amber badge)
3. Type a command like: `"Fetch the latest AI news"`
4. The agent will: call your Hermes model → generate tool calls → execute tools → return results
5. Check the activity log for confirmation

### Troubleshooting Hermes Setup

| Issue | Solution |
|-------|---------|
| "Hermes endpoint URL not configured" | Enter the endpoint URL in Settings → AI Agent Configuration |
| "Hermes endpoint error: 404" | Make sure your server is running and the URL ends with `/v1` |
| "Hermes endpoint error: connection refused" | Check that Ollama/vLLM/LM Studio is running: `curl http://localhost:11434/v1/models` |
| "Hermes endpoint error: 401" | Your endpoint requires auth — add the API key in Settings |
| Tool calls not working | Ensure you're using a Hermes function-calling trained model (Hermes 2 Pro or Hermes 3) |
| Slow responses (10+ seconds) | Use a GPU for inference, or try a smaller model (8B instead of 70B) |
| Out of memory errors | Use a quantized model (AWQ/GGUF), reduce `--max-model-len`, or use a smaller model |
| Remote endpoint not accessible | Check firewall rules, ensure the port is open, verify HTTPS if using SSL |

---

## Tool Reference

Both OpenClaw and Hermes frameworks share the same 6 tools. The agent decides which tools to call based on your natural language command.

### `fetch_news`

Fetch recent news articles from RSS feeds (TechCrunch, Harvard Business Review, Social Media Examiner).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | string | Yes | Topic or keyword to filter by (e.g., "AI", "social media"). Use empty string for all topics. |
| `limit` | number | No | Max number of articles to return. Default: 5 |

**Example commands:**
- `"Fetch the latest AI news"`
- `"Get 10 articles about social media marketing"`
- `"What's trending in tech?"`

**Returns:** JSON array of articles with title, description, link, and publication date.

---

### `post_to_omnisocial`

Create and publish a social media post via OmniSocial. Supports all 10 platforms.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Post content. For Instagram carousels, separate slides with `\u0060---SLIDE---\u0060`. Include hashtags. |
| `platforms` | string[] | Yes | Array of platform names: `instagram`, `facebook`, `linkedin`, `threads`, `tiktok`, `youtube`, `pinterest`, `bluesky`, `mastodon`, `x` |
| `media_urls` | string[] | No | Array of image URLs to attach. |
| `scheduled_at` | string | No | ISO 8601 datetime to schedule the post. Omit for immediate posting. |

**Example commands:**
- `"Post 'AI is transforming marketing! 🚀 #AI #Marketing' on Instagram and Twitter"`
- `"Schedule a post about our new product launch for tomorrow at 9am on LinkedIn and Facebook"`
- `"Create an Instagram carousel about 5 marketing tips"`

**Returns:** Post ID, published platforms, and scheduling confirmation.

---

### `create_whatsapp_campaign`

Create a WhatsApp billboard campaign — a status update with media that promotes your brand or NFC card.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `campaignName` | string | Yes | Name of the campaign. |
| `caption` | string | Yes | Text content for the WhatsApp status. |
| `mediaUrl` | string | No | Image URL, or gradient like `from-purple-900 to-emerald-950`. |
| `scheduledAt` | string | No | When to publish the campaign. |

**Example commands:**
- `"Create a WhatsApp campaign called 'Summer Sale' with caption '50% off all items!'"`
- `"Post a WhatsApp billboard about our new NFC cards"`

**Returns:** Campaign creation confirmation with queue status.

---

### `add_competitor`

Add a competitor brand to the watch list for ongoing tracking and analysis.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `brandName` | string | Yes | Competitor brand name. |
| `handleInstagram` | string | No | Instagram handle (without @). |
| `handleYoutube` | string | No | YouTube channel name. |
| `handleTiktok` | string | No | TikTok handle (without @). |
| `handleX` | string | No | X/Twitter handle (without @). |
| `handleLinkedin` | string | No | LinkedIn company page slug. |

**Example commands:**
- `"Add Nike to my competitor watch list with Instagram handle nike"`
- `"Track competitor Adidas on Instagram, TikTok, and X"`

**Returns:** Confirmation that the competitor was added.

---

### `get_analytics`

Get a summary of social media analytics from OmniSocial.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | string | No | Specific platform or `"all"`. Default: all platforms. |
| `days` | number | No | Number of days to look back. Default: 30. |

**Example commands:**
- `"Show me my Instagram analytics for the last week"`
- `"Get analytics across all platforms for the past 30 days"`
- `"How's my Twitter performance this month?"`

**Returns:** JSON with impressions, engagement rates, top posts, and platform breakdowns.

---

### `manage_nfc_card`

Create an NFC card configuration. NFC cards redirect to a URL when a phone taps them.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cardName` | string | Yes | Name for the NFC card. |
| `redirectType` | string | Yes | One of: `INSTAGRAM`, `LINK_IN_BIO`, `CUSTOM_URL`, `WHATSAPP_CHAT` |
| `destinationUrl` | string | Yes | URL the card redirects to. |
| `isActive` | boolean | No | Whether the card is active. Default: true. |

**Example commands:**
- `"Create an NFC card called 'Business Card' that redirects to my Instagram @mybrand"`
- `"Make an NFC card for my WhatsApp chat at +1234567890"`

**Returns:** Card name, redirect type, and destination URL confirmation.

---

## WhatsApp Integration Setup

### Prerequisites

- A [Twilio](https://www.twilio.com) account with WhatsApp Business API access
- A Twilio phone number with WhatsApp enabled
- Your ContentDash app deployed and publicly accessible (for webhook)

### Step 1: Get Twilio Credentials

1. Go to https://console.twilio.com
2. Copy your **Account SID** (starts with `AC...`)
3. Copy your **Auth Token** (found on the same page)
4. Note your **WhatsApp-enabled phone number**

### Step 2: Configure in ContentDash

1. Go to **Settings → AI Agent Configuration**
2. Scroll to **Twilio WhatsApp Integration**
3. Enter your **Account SID**, **Auth Token**, and **WhatsApp Number** (e.g., `+1234567890`)
4. Click **Save Agent Config**

### Step 3: Set Up Webhook in Twilio

1. In Twilio Console, go to **Messaging → Settings → WhatsApp Sandbox** (or your WhatsApp sender)
2. Set the **When a message comes in** URL to:
   ```
   https://your-app.vercel.app/api/agent/whatsapp
   ```
3. Set HTTP method to **POST**
4. Save

### Step 4: Test

1. Send a WhatsApp message to your Twilio number: `"Post about AI trends on Instagram"`
2. ContentDash will process the command through your selected agent framework
3. You'll receive a WhatsApp reply with the result
4. Check the OpenClaw activity log for the execution details

### How It Works

```
WhatsApp Message → Twilio → POST /api/agent/whatsapp
                                    │
                                    ▼
                        Validate Twilio HMAC-SHA1 signature
                                    │
                                    ▼
                        Match WhatsApp number to AgentConfig
                                    │
                                    ▼
                        Dispatch to OpenClaw or Hermes
                                    │
                                    ▼
                        Execute tool loop (max 8 iterations)
                                    │
                                    ▼
                        Log to AgentLog → Reply via TwiML
```

---

## NFC Card Setup

### Redirect Types

| Type | Description | Example Destination URL |
|------|-------------|------------------------|
| `INSTAGRAM` | Redirects to an Instagram profile | `https://instagram.com/yourbrand` |
| `LINK_IN_BIO` | A general link-in-bio page | `https://linktr.ee/yourbrand` |
| `CUSTOM_URL` | Any custom URL | `https://yourwebsite.com/promo` |
| `WHATSAPP_CHAT` | Opens a WhatsApp chat with a number | `https://wa.me/1234567890` |

### How NFC Taps Work

1. Someone taps their phone on your NFC card
2. The phone reads the NFC tag's URL: `https://your-app.vercel.app/t/card-slug`
3. ContentDash looks up the card by slug
4. Logs the tap event (timestamp) in `NFCTapEvent`
5. Redirects the phone to the card's `destinationUrl`

### Analytics

- View tap counts and timestamps on the **NFC Cards** page
- Each tap is logged with the card ID and timestamp
- Tap data is indexed for fast queries

---

## FAQ / Troubleshooting

### General

**Q: I'm getting "AI agent not configured" when trying to use the agent**
A: Go to Settings → AI Agent Configuration, select a framework, provide the required credentials (API key for OpenClaw, endpoint URL for Hermes), and click Save.

**Q: I changed my LLM provider but the agent still uses the old one**
A: After changing settings, the new configuration is effective immediately. Try refreshing the OpenClaw page.

**Q: The agent says it can't do something I expected**
A: The agent is limited to its 6 tools. If you ask it to do something outside those capabilities (like sending emails or editing images), it will explain what it can do instead.

### OpenClaw

**Q: "Failed to decrypt LLM API key"**
A: The `ENCRYPTION_SALT` env var may have changed. If you had keys encrypted with the old salt, set `ENCRYPTION_SALT=contentdash-salt-v1` temporarily, re-save your API key through Settings, then switch to the new salt.

**Q: "OpenAI API error: 429"**
A: You've hit OpenAI's rate limit. Wait a minute and try again, or upgrade your OpenAI plan.

**Q: "Anthropic API error: 401"**
A: Your Anthropic API key is invalid or expired. Generate a new one at https://console.anthropic.com.

### Hermes

**Q: "Hermes endpoint URL not configured"**
A: You selected the Hermes framework but didn't provide an endpoint URL. Go to Settings and enter your model server URL (e.g., `http://localhost:11434/v1`).

**Q: "Hermes endpoint error: connection refused"**
A: Your model server isn't running. Start it with `ollama serve`, `vllm ...`, or open LM Studio and click Start Server.

**Q: Hermes responds but doesn't call tools**
A: Make sure you're using a Hermes function-calling model (Hermes 2 Pro or Hermes 3). Regular Llama models don't support the `tool_call>` format.

**Q: "Hermes endpoint error: 404"**
A: Your endpoint URL might be wrong. For Ollama, use `http://localhost:11434/v1`. For LM Studio, use `http://localhost:1234/v1`. Verify with: `curl http://localhost:11434/v1/models`.

**Q: How do I switch from Hermes back to OpenClaw?**
A: Go to Settings → AI Agent Configuration → change the framework dropdown to "OpenClaw" → enter your LLM API key → Save.

### WhatsApp

**Q: WhatsApp messages aren't getting responses**
A: Check that (1) your Twilio webhook URL is set correctly, (2) your agent is configured and active in Settings, (3) your Twilio auth token matches what's saved in ContentDash.

**Q: "Invalid Twilio signature"**
A: The `TWILIO_AUTH_TOKEN` env var must match the auth token from your Twilio account. Also ensure `NEXT_PUBLIC_APP_URL` matches your actual app URL.

### Encryption

**Q: "Failed to decrypt OmniSocial API key"**
A: The encryption salt may have changed. See the Encryption Salt Rotation section above.

**Q: Can I see my stored API keys?**
A: No — keys are encrypted at rest and only displayed as masked (`****1234`) in the API. The full key is never returned to the client.

### Rate Limiting

**Q: "Rate limit exceeded" (429 error)**
A: You've made more than 10 agent requests in a minute. Wait 60 seconds and try again. The response headers include `X-RateLimit-Reset` with the reset timestamp.

### NFC Smart Profiles

**Q: "Invalid activation code"**
A: Make sure you're entering the 8-character code exactly as shown on the order confirmation page. Codes are case-insensitive. If you lost the code, check the NFC page in ContentDash — it may still be displayed.

**Q: "Card not activated" page appears when tapping**
A: The NFC card hasn't been activated yet. Enter the activation code in the Smart Profile Editor at `/nfc/editor`.

**Q: How do I change my public profile URL?**
A: The `profileSlug` is auto-generated from your display name when you first save. To change it, update your display name and re-save — the slug will regenerate.

**Q: How many links can I add?**
A: Up to 20 links per profile, in 14 types: instagram, whatsapp, google_review, phone, email, website, maps, shop, booking, youtube, twitter, linkedin, facebook, custom.

**Q: How do I upload an avatar?**
A: In the Smart Profile Editor, click the avatar area to upload an image file. It's stored in Supabase Storage (`nfc-avatars` bucket). You can also paste a URL instead.

---

## NFC Smart Profile System

### Overview

When someone taps an activated NFC card with a Smart Profile, they see a public profile page (`/p/[profileSlug]`) with the owner's name, bio, avatar, and social/contact links — instead of a simple URL redirect.

### Flow

```
Purchase NFC Card → Receive activation code
                    ↓
Enter code in /nfc/editor → Card activated → Profile editor
                    ↓
Edit profile (name, bio, avatar, links) → Save → Public profile live at /p/[slug]
                    ↓
Someone taps card → /t/[cardSlug] → redirect to /p/[slug]
```

### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/nfc/activate` | POST | Validate activation code, activate card, link to user |
| `/api/nfc/profile` | GET | Fetch profile + links by cardId |
| `/api/nfc/profile` | PUT | Upsert profile + replace all links |
| `/api/nfc/avatar` | POST | Upload avatar file to Supabase Storage |

### Database Schema

**NFCProfile** — card-level profile (1:1 with NFCCard)

| Column | Type | Notes |
|---|---|---|
| cardId | UUID (PK, FK→NFCCard) | One profile per card |
| displayName | TEXT NOT NULL | Shown on public page |
| bio | TEXT | Optional |
| avatarUrl | TEXT | Storage URL or external URL |
| theme | TEXT DEFAULT 'default' | Reserved for future themes |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

**NFCLink** — social/contact links belonging to a profile

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| cardId | UUID (FK→NFCProfile) | Links belong to a profile |
| type | TEXT | One of 14 types (CHECK constraint) |
| label | TEXT | Display text |
| url | TEXT | Target URL/phone/email |
| linkOrder | INTEGER | Sort order |
| createdAt | TIMESTAMPTZ | |

**NFCCard additions** (existing table, new columns)

| Column | Type | Notes |
|---|---|---|
| activationCode | VARCHAR(8) UNIQUE | Generated on purchase |
| isActivated | BOOLEAN DEFAULT false | Set true on activation |
| profileSlug | VARCHAR UNIQUE | Auto-generated from displayName |

### Link Types

| Type | Icon | Color |
|---|---|---|
| instagram | 📸 | pink-500 |
| whatsapp | 📱 | emerald-500 |
| google_review | ⭐ | yellow-500 |
| phone | 📞 | blue-500 |
| email | 📧 | violet-500 |
| website | 🌐 | cyan-500 |
| maps | 📍 | orange-500 |
| shop | 🛍️ | rose-500 |
| booking | 📅 | teal-500 |
| youtube | ▶️ | red-500 |
| twitter | 🐦 | sky-500 |
| linkedin | 💼 | blue-600 |
| facebook | 📘 | blue-500 |
| custom | 🔗 | zinc-400 |

### RLS Policies

- **Owner CRUD**: Users can insert/update/delete their own profiles and links (via `cardId→NFCCard→userId` join)
- **Public read**: Anyone can read profiles/links for activated cards that have a `profileSlug`
- **Avatar bucket**: `nfc-avatars` storage bucket is publicly readable; uploads require authentication

### Public Routes

`/p/[profileSlug]` and `/docs` are public — no auth required. Configured in `src/proxy.ts` under `PUBLIC_PATHS`.
