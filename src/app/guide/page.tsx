"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LogIn,
  Wifi,
  Share2,
  BarChart3,
  CalendarDays,
  Sparkles,
  CreditCard,
  Lock,
  CheckCircle2,
  ArrowRight,
  User,
  Image,
  Link2,
  QrCode,
  MessageCircle,
  Swords,
  Newspaper,
  Settings,
  BookOpen,
  Zap,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "welcome", label: "Welcome", icon: Zap },
  { id: "sign-up", label: "Create Account", icon: LogIn },
  { id: "connect", label: "Connect Platforms", icon: Wifi },
  { id: "social", label: "Social Manager", icon: Share2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "agent", label: "AI Agent", icon: Sparkles },
  { id: "nfc", label: "NFC Smart Profile", icon: CreditCard },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "competitors", label: "Competitors", icon: Swords },
  { id: "news", label: "News Feed", icon: Newspaper },
  { id: "next-steps", label: "Next Steps", icon: ArrowRight },
];

function StepNav({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="sticky top-6 space-y-1">
      {STEPS.map((s) => {
        const Icon = s.icon;
        const isActive = active === s.id;
        const idx = STEPS.findIndex((x) => x.id === s.id);
        return (
          <button
            key={s.id}
            onClick={() => onNavigate(s.id)}
            className={cn(
              "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-left transition-colors",
              isActive
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            )}
          >
            <span className={cn(
              "flex size-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
              isActive ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-500"
            )}>
              {idx + 1}
            </span>
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Welcome() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Welcome to ContentDash</h2>
        <p className="text-zinc-400">Your AI-powered content command center. Manage social media, automate with AI agents, create NFC Smart Profiles, and grow your audience — all from one dashboard.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: Share2, title: "10 Platforms", desc: "Instagram, YouTube, TikTok, X, LinkedIn, Facebook, Pinterest, Threads, Reddit, Bluesky" },
          { icon: Sparkles, title: "2 AI Frameworks", desc: "OpenClaw (cloud) and Hermes (self-hosted) — pick the agent that fits your workflow" },
          { icon: CreditCard, title: "NFC Smart Profiles", desc: "Physical NFC cards with digital profiles — share your links with a tap" },
          { icon: BarChart3, title: "Unified Analytics", desc: "Impressions, engagement, follower growth across all platforms in one view" },
        ].map((f) => (
          <Card key={f.title} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-5 space-y-2">
              <f.icon className="size-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-zinc-200">{f.title}</h3>
              <p className="text-xs text-zinc-500">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-indigo-600/10 border-indigo-600/30">
        <CardContent className="pt-5 flex items-start gap-3">
          <Zap className="size-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-300">Quick Start</h3>
            <p className="text-xs text-zinc-400 mt-1">This guide walks you through every feature step by step. Follow along at your own pace — you can come back anytime from the sidebar under Docs.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SignUp() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Step 1 — Create Your Account</h2>
        <p className="text-zinc-400">Get started in under a minute.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">How to sign up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
              <span>Visit the <Link href="/login" className="text-indigo-400 hover:underline">login page</Link></span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
              <span>Click <strong className="text-zinc-100">&ldquo;Sign Up&rdquo;</strong> at the top to switch to registration mode</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">3</span>
              <span>Enter your email and choose a strong password (8+ chars, mixed case, number, symbol)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">4</span>
              <span>Check your email for a confirmation link, then log in</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-5 flex items-start gap-3">
          <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">After signing up</h3>
            <p className="text-xs text-zinc-400 mt-1">You&apos;ll land on the Dashboard. It shows empty states until you connect your social accounts and set up your AI agent.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Connect() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Step 2 — Connect Your Social Platforms</h2>
        <p className="text-zinc-400">Link your social accounts through OmniSocial to unlock posting, analytics, and more.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">OmniSocial setup</CardTitle>
          <CardDescription className="text-zinc-500">OmniSocial is the API layer that connects ContentDash to 10 social platforms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
              <span>Go to <Link href="/settings" className="text-indigo-400 hover:underline">Settings</Link> and find the <strong className="text-zinc-100">OmniSocial Connection</strong> section</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
              <span>Enter your OmniSocial API key (get one at <span className="text-zinc-400">omnisocials.com</span>)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">3</span>
              <span>Click <strong className="text-zinc-100">Connect</strong> — ContentDash validates the key and shows your connected platforms</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">4</span>
              <span>Once connected, the sidebar shows a green <Wifi className="inline size-3 text-emerald-500" /> status indicator</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">API Key mode</h3>
            <p className="text-xs text-zinc-500">Paste your OmniSocial API key directly. Best for most users.</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">MCP URL mode</h3>
            <p className="text-xs text-zinc-500">Paste a full MCP URL with the key embedded. ContentDash auto-extracts it.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SocialManager() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Step 3 — Social Content Manager</h2>
        <p className="text-zinc-400">Create, schedule, and manage posts across all your connected platforms.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Two views</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-indigo-600/20 text-indigo-400">Status View</Badge>
              <p className="text-xs text-zinc-500">Kanban board with columns: Scheduled, Drafts, Published, Backlog. Drag posts between columns.</p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-indigo-600/20 text-indigo-400">Platform View</Badge>
              <p className="text-xs text-zinc-500">Grid layout organized by platform. Filter to see all posts for Instagram, YouTube, etc.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Creating a post</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
              <span>Click <strong className="text-zinc-100">New Post</strong> to open the post dialog</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
              <span>Write your content, attach media (uploaded to Supabase Storage)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">3</span>
              <span>Select which platforms to publish to (multi-platform posting)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">4</span>
              <span>Schedule for later or publish immediately</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-5 flex items-start gap-3">
          <Share2 className="size-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Quick access</h3>
            <p className="text-xs text-zinc-400 mt-1">The <Link href="/instagram" className="text-indigo-400 hover:underline">/instagram</Link> shortcut redirects to the Social Manager filtered to Instagram.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Analytics() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Step 4 — Analytics Dashboard</h2>
        <p className="text-zinc-400">Track performance across all connected platforms with unified metrics.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Total Impressions", desc: "How many times your content was seen across all platforms" },
          { label: "Engagement Rate", desc: "Likes, comments, shares as a percentage of impressions" },
          { label: "Follower Growth", desc: "Net follower change over your selected date range" },
          { label: "Top Posts", desc: "Your best-performing content ranked by engagement" },
        ].map((m) => (
          <Card key={m.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 space-y-1">
              <h3 className="text-sm font-semibold text-zinc-200">{m.label}</h3>
              <p className="text-xs text-zinc-500">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Charts & filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <ul className="space-y-2">
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Impressions area chart over time</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Engagement rate line chart</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Platform breakdown horizontal bar chart</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Date range selector (default: last 30 days)</span></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Calendar() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Step 5 — Content Calendar</h2>
        <p className="text-zinc-400">Visualize your content schedule on a monthly calendar grid.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Calendar features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <ul className="space-y-2">
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Monthly grid view with colored dots per platform</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Navigate months forward and back</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Filter by platform to focus on one channel</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Click a post to see details and quick actions</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Create new posts directly from the calendar</span></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Agent() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Step 6 — AI Agent (OpenClaw / Hermes)</h2>
        <p className="text-zinc-400">Automate content tasks with an AI agent. Choose between cloud APIs or your own self-hosted model.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-zinc-900 border-violet-600/30">
          <CardHeader>
            <CardTitle className="text-base text-violet-300 flex items-center gap-2">
              <Sparkles className="size-4" /> OpenClaw
            </CardTitle>
            <CardDescription className="text-zinc-500">Cloud LLM APIs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-zinc-400">
            <p>Uses OpenAI, Anthropic, or Google Gemini APIs. Enter your API key in Settings, type natural-language commands, and the agent executes them.</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {["OpenAI", "Anthropic", "Gemini"].map((p) => (
                <Badge key={p} variant="secondary" className="bg-violet-600/20 text-violet-400 text-[10px]">{p}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-amber-600/30">
          <CardHeader>
            <CardTitle className="text-base text-amber-300 flex items-center gap-2">
              <Globe className="size-4" /> Hermes
            </CardTitle>
            <CardDescription className="text-zinc-500">Self-Hosted LLM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-zinc-400">
            <p>Runs on your own hardware via Ollama, vLLM, or LM Studio. Uses Hermes ChatML function-calling format. No cloud API keys needed.</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {["Ollama", "vLLM", "LM Studio"].map((p) => (
                <Badge key={p} variant="secondary" className="bg-amber-600/20 text-amber-400 text-[10px]">{p}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">6 Built-in Tools</CardTitle>
          <CardDescription className="text-zinc-500">Both frameworks share the same tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { name: "fetch_news", desc: "Aggregate RSS feeds for content ideas" },
              { name: "post_to_omnisocial", desc: "Create and publish social posts" },
              { name: "create_whatsapp_campaign", desc: "Schedule WhatsApp billboard campaigns" },
              { name: "add_competitor", desc: "Track competitor social accounts" },
              { name: "get_analytics", desc: "Pull platform performance metrics" },
              { name: "manage_nfc_card", desc: "Configure NFC card redirect settings" },
            ].map((t) => (
              <div key={t.name} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                <code className="text-xs text-indigo-400">{t.name}</code>
                <p className="text-xs text-zinc-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
              <span>Go to <Link href="/settings" className="text-indigo-400 hover:underline">Settings</Link> → AI Agent Configuration</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
              <span>Choose your framework (OpenClaw or Hermes)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">3</span>
              <span>Enter API key (OpenClaw) or endpoint URL (Hermes)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">4</span>
              <span>Save, then open the <Link href="/openclaw" className="text-indigo-400 hover:underline">OpenClaw command center</Link> to start</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-amber-600/10 border-amber-600/30">
        <CardContent className="pt-5 flex items-start gap-3">
          <Lock className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-300">Pro Feature</h3>
            <p className="text-xs text-zinc-400 mt-1">The AI Agent requires an active plan. Choose Standalone Pro ($29/mo) or NFC Bundle ($49 one-time) from the OpenClaw page.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NFC() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Step 7 — NFC Smart Profile</h2>
        <p className="text-zinc-400">Turn physical NFC cards into digital profile pages. Someone taps your card → they see your links, bio, and contact info.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-sm">
            {[
              { icon: CreditCard, label: "Order card" },
              { icon: ArrowRight, label: "" },
              { icon: Lock, label: "Activate" },
              { icon: ArrowRight, label: "" },
              { icon: User, label: "Edit profile" },
              { icon: ArrowRight, label: "" },
              { icon: QrCode, label: "Go live" },
              { icon: ArrowRight, label: "" },
              { icon: Globe, label: "Tap → profile" },
            ].map((step, i) => {
              const Icon = step.icon;
              if (!step.label) return <ArrowRight key={i} className="size-4 text-zinc-600 shrink-0 hidden sm:block" />;
              return (
                <div key={i} className="flex items-center gap-2 shrink-0">
                  <div className="flex size-8 items-center justify-center rounded-full bg-indigo-600/20">
                    <Icon className="size-4 text-indigo-400" />
                  </div>
                  <span className="text-zinc-300">{step.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Ordering a card</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
              <span>Go to <Link href="/nfc" className="text-indigo-400 hover:underline">NFC Cards</Link> and scroll to <strong className="text-zinc-100">Order Physical Cards</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
              <span>Pick a finish: Matte Black, Brushed Gold, or Sterling Silver</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">3</span>
              <span>Choose quantity (1, 3, 5, or 10 cards with tiered pricing)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">4</span>
              <span>Enter your business name and pay via Flutterwave</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">5</span>
              <span>After payment, you receive an <strong className="text-indigo-400">8-character activation code</strong> — save this!</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Activating & building your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
              <span>Go to <Link href="/nfc/editor" className="text-indigo-400 hover:underline">Smart Profile Editor</Link></span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
              <span>Enter your activation code → card is now linked to your account</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">3</span>
              <span>Set your display name, bio, and upload an avatar photo</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">4</span>
              <span>Add links — pick from 14 types:</span>
            </li>
          </ol>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["Instagram", "WhatsApp", "Google Review", "Phone", "Email", "Website", "Maps", "Shop", "Booking", "YouTube", "X / Twitter", "LinkedIn", "Facebook", "Custom"].map((t) => (
              <Badge key={t} variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px]">{t}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Your public profile</CardTitle>
          <CardDescription className="text-zinc-500">Live at /p/your-name — no login required to view</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <ul className="space-y-2">
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Mobile-first layout with subtle glow background</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Avatar, display name, bio at the top</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Link buttons with type-specific icons and colors</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>OG metadata for social sharing previews</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>QR code in the editor links directly to your profile URL</span></li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">What happens when someone taps your card</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-zinc-400">
            <p><strong className="text-zinc-200">Activated + Profile:</strong> Phone opens your public profile page at /p/your-name</p>
            <p><strong className="text-zinc-200">Activated + No Profile:</strong> Phone redirects to your destination URL (the original redirect link)</p>
            <p><strong className="text-zinc-200">Not Activated:</strong> Shows a styled &ldquo;Card Not Activated&rdquo; landing page</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WhatsApp() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Step 8 — WhatsApp Billboard</h2>
        <p className="text-zinc-400">Create WhatsApp status campaigns that drive views, clicks, and replies.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Creating a campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
              <span>Go to <Link href="/whatsapp" className="text-indigo-400 hover:underline">WhatsApp Billboard</Link></span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
              <span>Name your campaign, choose media type (image URL or gradient)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">3</span>
              <span>Add a caption and schedule the date/time</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">4</span>
              <span>Preview in the phone mockup, then publish</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Campaign management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <ul className="space-y-2">
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Toggle campaigns between Active and Paused</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Track views, CTR, and replies per campaign</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Estimated billing at $0.01 per view</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Filter by All, Active, or Scheduled tabs</span></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Competitors() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Step 9 — Competitor Tracker</h2>
        <p className="text-zinc-400">Monitor competitor social accounts — followers, posting frequency, engagement, audience health.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Adding a competitor</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
              <span>Click <strong className="text-zinc-100">Add Competitor</strong> and enter the brand name</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
              <span>Optionally add their social handles (Instagram, YouTube, TikTok, X, LinkedIn)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">3</span>
              <span>Click a competitor row to see detailed demographics, ad spend, and content sentiment</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Detail panel — two tabs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-indigo-600/20 text-indigo-400">Demographics & Spend</Badge>
              <p className="text-xs text-zinc-500">Follower activity, promoted post analysis, estimated ad spend, audience age breakdown</p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-indigo-600/20 text-indigo-400">Content & Sentiment</Badge>
              <p className="text-xs text-zinc-500">Comment sentiment analysis, most liked posts, content themes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function News() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Step 10 — News Feed</h2>
        <p className="text-zinc-400">Curated articles from TechCrunch, Harvard Business Review, and Social Media Examiner.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-400">
          <ul className="space-y-2">
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Featured article card with quick actions</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Topic tabs: All, Tools, AI Research, Business, Growth, Strategy</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Search and sort articles</span></li>
            <li className="flex gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" /> <span><strong className="text-zinc-200">Synthesize Idea</strong> — AI generates a social post draft from an article</span></li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-indigo-600/10 border-indigo-600/30">
        <CardContent className="pt-5 flex items-start gap-3">
          <Sparkles className="size-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-300">AI-powered synthesis</h3>
            <p className="text-xs text-zinc-400 mt-1">Click &ldquo;Synthesize Idea&rdquo; on any article to have the AI agent draft a social media post based on the content. Requires an active agent configuration.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NextSteps() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-100">Next Steps</h2>
        <p className="text-zinc-400">You&apos;re all set! Here&apos;s where to go from here.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { icon: Settings, label: "Configure Settings", href: "/settings", desc: "API keys, agent setup, profile" },
          { icon: Sparkles, label: "Try the AI Agent", href: "/openclaw", desc: "Type a command and watch it work" },
          { icon: CreditCard, label: "Order an NFC Card", href: "/nfc", desc: "Get your physical Smart Profile card" },
          { icon: Share2, label: "Create Your First Post", href: "/social-manager", desc: "Schedule content across platforms" },
          { icon: BookOpen, label: "Read the Docs", href: "/docs", desc: "Deep technical reference" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
                <CardContent className="pt-5 space-y-2">
                  <Icon className="size-5 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">{item.label}</h3>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base text-zinc-200">Keyboard shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            {[
              { key: "/", desc: "Focus search/command" },
              { key: "G then D", desc: "Go to Dashboard" },
              { key: "G then S", desc: "Go to Social Manager" },
              { key: "G then N", desc: "Go to NFC Cards" },
            ].map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <kbd className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 border border-zinc-700">{s.key}</kbd>
                <span className="text-zinc-500 text-xs">{s.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-emerald-600/10 border-emerald-600/30">
        <CardContent className="pt-5 flex items-start gap-3">
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-300">You&apos;re ready!</h3>
            <p className="text-xs text-zinc-400 mt-1">ContentDash is set up. Start creating content, let the AI agent handle the routine tasks, and share your Smart Profile with the world.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const STEP_COMPONENTS: Record<string, () => React.ReactElement> = {
  welcome: Welcome,
  "sign-up": SignUp,
  connect: Connect,
  social: SocialManager,
  analytics: Analytics,
  calendar: Calendar,
  agent: Agent,
  nfc: NFC,
  whatsapp: WhatsApp,
  competitors: Competitors,
  news: News,
  "next-steps": NextSteps,
};

export default function GuidePage() {
  const [activeStep, setActiveStep] = useState("welcome");

  const StepComponent = STEP_COMPONENTS[activeStep] || Welcome;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header title="Getting Started" />
      <div className="flex">
        <aside className="hidden lg:block w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Getting Started</h2>
            <StepNav active={activeStep} onNavigate={setActiveStep} />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <StepComponent />
          </div>
        </main>
      </div>
    </div>
  );
}
