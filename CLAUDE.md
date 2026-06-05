# ContentDash — Tech Stack & Architecture Document

AI-Powered Content Management Dashboard v2.0.0 built with Next.js 16 (App Router), Tailwind CSS v4, and shadcn/ui components (Base UI primitives), powered by OmniSocial as the core brain.

## Tech Stack
- **Framework:** Next.js v16.2.6 (App Router, TypeScript, React 19)
- **Styling:** Tailwind CSS v4 (with native @theme CSS configuration)
- **Component Library:** shadcn/ui components (Base UI primitives)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Validation:** Zod v4
- **State:** Zustand v5
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Payments:** Flutterwave
- **Testing:** Vitest

## Key Features (v2.0.0)
1. **OmniSocial Core Integration:** Built-in SDK (`src/lib/omnisocial.ts`) managing multi-platform posts, media uploads, statistics, and endpoints (`api.omnisocials.com/v1`).
2. **Multi-Platform Social Manager:** Kanban-style board (Scheduled, Drafts, Published, Backlog) with platform filtering, view mode toggling, OmniSocial sync, and new post creation.
3. **Multi-Platform Analytics:** Impressions heatmaps, platform engagement indicators, follower trackers, and a sortable top posts index using Recharts area, line, and bar visualization — wired to live OmniSocial analytics API.
4. **Content Calendar:** A custom, fully responsive day grid layout mapping scheduled and published content across calendar months with cross-platform toggle badges and post creation dialog.
5. **Competitor Tracker:** Sortable target index tracking metrics, organic audience statistics, comments sentiment indicators, and target brand ad keywords — data persisted via Supabase.
6. **News Consolidator:** Real-time niche RSS feeds visualizer with an AI-powered social copy generator using the OpenClaw agent.
7. **WhatsApp Status Billboard:** Schedule status updates on active queues, monitor billing views, and preview content through a simulated smartphone screen — campaigns persisted via API.
8. **Smart NFC Card Configurator:** Hardware redirect configurator (Insta/Link-in-Bio/custom/WhatsApp) with file upload, tap analytics, and Flutterwave checkout.
9. **OpenClaw AI Agent:** Autonomous subagent command center with live activity logs, toggleable autonomous modules (inbox autopilot, competitor scraper, smart posting), competitor watchlist, and terminal command interface — powered by multi-provider LLM (OpenAI/Anthropic/Gemini) with tool calling.
10. **Security Hardening:** HMAC-SHA1 Twilio webhook validation, timing-safe Flutterwave webhook, AES-256-GCM encryption with configurable salt, input validation via Zod on all API routes, rate limiting on sensitive endpoints.
11. **Auth Infrastructure:** Supabase Auth with OAuth callback route, session management via middleware proxy, password strength indicator on signup.

## Folder Structure
```
content-dash/
├── supabase/
│   └── migrations/          # SQL migrations (indexes, enums, constraints)
├── vitest.config.ts         # Test runner configuration
└── src/
    ├── app/                 # Next.js App Router structure
    │   ├── layout.tsx       # Forced dark layout & sidebar wrapper
    │   ├── page.tsx         # Dashboard Main Page
    │   ├── api/             # API routes
    │   │   ├── agent/       # AI agent (execute, config, logs, whatsapp, tools, executor)
    │   │   ├── auth/        # Auth callback
    │   │   ├── competitors/ # Competitor CRUD (+ [id] for DELETE/PATCH)
    │   │   ├── nfc/cards/   # NFC card CRUD (+ [id] for DELETE)
    │   │   ├── news/        # RSS news feed
    │   │   ├── omnisocial/  # OmniSocial proxy (config, analytics, accounts, posts, upload)
    │   │   ├── payments/    # Flutterwave payments + webhook
    │   │   └── whatsapp/    # WhatsApp campaigns CRUD (+ [id] for DELETE)
    │   ├── analytics/       # Recharts marketing analytics page
    │   ├── calendar/        # date-fns dynamic content calendar
    │   ├── competitors/     # Competitor intelligence table and analytics
    │   ├── login/           # Auth page with password strength
    │   ├── news/            # Niche consolidator and AI social copy generator
    │   ├── nfc/             # Hardware redirect configurator & shop cart
    │   ├── openclaw/        # AI agent command center
    │   ├── settings/        # OmniSocial + AI agent configuration
    │   ├── social-manager/  # Multi-platform content manager
    │   └── whatsapp/        # Status billboard scheduler with live device preview
    ├── components/
    │   ├── layout/          # Header (wired search/signout) and Sidebar (live connection status)
    │   ├── social-manager/  # PlatformIconBar, PlatformStats, NewPostDialog, PostCard, PostTypeBadge
    │   └── ui/              # shadcn/ui primitive component registry (Base UI)
    ├── hooks/
    │   └── useSocialMediaStore.ts  # Zustand store with API persistence
    ├── lib/
    │   ├── __tests__/       # Vitest test suite (encryption, schemas, rate-limit, LLM)
    │   ├── api/             # API helpers (omnisocial-proxy, social)
    │   ├── validations/     # Zod schemas for all API routes
    │   ├── data/            # Demo data (dev only)
    │   ├── encryption.ts    # AES-256-GCM with configurable salt
    │   ├── llm.ts           # Multi-provider LLM client (OpenAI/Anthropic/Gemini) with tool calling
    │   ├── omnisocial.ts    # OmniSocial SDK Client Library
    │   ├── rate-limit.ts    # In-memory sliding window rate limiter
    │   ├── supabase/        # Supabase client (server + browser)
    │   └── utils.ts         # Helper utility functions (cn)
    ├── proxy.ts             # Next.js 16 proxy (auth middleware)
    └── types/
        ├── db.ts            # Manual DB types (replaces Prisma generated types)
        └── social.ts        # Social media type definitions
```

## API Validation
All API routes use Zod schemas defined in `src/lib/validations/schemas.ts`. The `validateBody` helper returns either `{ data }` or `{ error }`.

## Rate Limiting
- `/api/agent/execute` — 10 requests/minute
- `/api/payments` — 5 requests/minute
- Other endpoints — 60 requests/minute (available, not yet applied)

## Styling & Component Conventions
- **Global Themes:** Dark mode is hard-forced globally on the `html` root node.
- **Design Primitives:** Zinc dark theme palettes (`bg-zinc-950` backgrounds, `bg-zinc-900` card templates, `border-zinc-800` borders, `text-zinc-400` descriptions).
- **Client Directives:** Use `"use client"` at the top of client-interactive templates (charts, forms, dialogs, map pings).
- **Responsive Layout:** Placed in columns collapsing systematically for smaller mobile display screens.

## Testing
Run `npm test` for the Vitest suite. Tests cover encryption roundtrips, Zod schema validation, rate limiting, and LLM message formatting for all three providers.
