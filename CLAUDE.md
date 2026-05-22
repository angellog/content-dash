# ContentDash — Tech Stack & Architecture Document

AI-Powered Content Management Dashboard v1.0.0 built with Next.js (App Router), Tailwind CSS v4, and shadcn/ui components, powered by OmniSocial as the core brain.

## Tech Stack
- **Framework:** Next.js v15.2.4 (App Router, TypeScript, React 19)
- **Styling:** Tailwind CSS v4 (with native @theme CSS configuration)
- **Component Library:** shadcn/ui components (Radix primitives)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns

## Key Features (v1.0.0)
1. **OmniSocial Core Integration:** Built-in SDK (`src/lib/omnisocial.ts`) managing multi-platform posts, media uploads, statistics, and endpoints (`api.omnisocials.com/v1`).
2. **Instagram Manager:** Scheduling calendar, draft pools, backlog queues, statistics visualizer, and instant post creation dialog.
3. **Multi-Platform Analytics:** Impressions heatmaps, platform engagement indicators, follower trackers, and a sortable top posts index using Recharts area, line, and bar visualization.
4. **Content Calendar:** A custom, fully responsive day grid layout mapping scheduled and published content across calendar months with cross-platform toggle badges.
5. **Competitor Tracker:** Sortable target index tracking metrics, organic audience statistics, comments sentiment indicators, and target brand ad keywords.
6. **News Consolidator:** Real-time niche RSS feeds visualizer with an OmniSocial text synthesizer wizard that allows draft curation directly from industry developments.
7. **WhatsApp Status Billboard:** Schedule status updates on active queues, monitor billing views, and preview content through a simulated smartphone screen.
8. **Smart NFC Card Configurator:** A dedicated configurator custom-crafting hardware redirects (Insta/Link-in-Bio/custom/WhatsApp) with an active taps heatmap/location visualizer and customizable metallic cards order cart.
9. **OpenClaw Pro Stub:** Autonomous subagent command center featuring live simulated activity logs, auto-reply triggers, and organic crawler toggles.

## Folder Structure
```
content-dash/
├── public/                 # Static assets
└── src/
    ├── app/                # Next.js App Router structure
    │   ├── layout.tsx      # Forced dark layout & sidebar wrapper
    │   ├── page.tsx        # Dashboard Main Page
    │   ├── instagram/      # Instagram content manager page
    │   ├── analytics/      # Recharts marketing analytics page
    │   ├── calendar/       # date-fns dynamic content calendar
    │   ├── competitors/    # Competitor intelligence table and analytics
    │   ├── news/           # Niche consolidator and social copy generator
    │   ├── whatsapp/       # Status billboard scheduler with live device preview
    │   ├── nfc/            # Hardware redirect configurator & shop cart
    │   └── openclaw/       # Pro subagent simulator
    ├── components/         # Custom & UI primitives
    │   ├── layout/         # Header and Sidebar components
    │   └── ui/             # shadcn/ui primitive component registry
    └── lib/
        ├── utils.ts        # Helper utility functions (cn)
        └── omnisocial.ts   # OmniSocial SDK Client Library
```

## Styling & Component Conventions
- **Global Themes:** Dark mode is hard-forced globally on the `html` root node.
- **Design Primitives:** Zinc dark theme palettes (`bg-zinc-950` backgrounds, `bg-zinc-900` card templates, `border-zinc-800` borders, `text-zinc-400` descriptions).
- **Client Directives:** Use `"use client"` at the top of client-interactive templates (charts, forms, dialogs, map pings).
- **Responsive Layout:** Placed in columns collapsing systematically for smaller mobile display screens.
