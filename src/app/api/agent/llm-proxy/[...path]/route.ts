import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

// OpenAI-compatible pass-through for the in-page agent (page-agent).
// The browser never sees the real LLM key: page-agent points its baseURL
// here, and this route forwards to the provider configured in AgentConfig
// using the server-side decrypted key. The model is pinned server-side so
// the client body can't select an arbitrary (pricier) model.
const PROVIDERS: Record<string, { baseURL: string; model: string }> = {
  openai: { baseURL: "https://api.openai.com/v1", model: "gpt-4o" },
  anthropic: { baseURL: "https://api.anthropic.com/v1", model: "claude-sonnet-4-20250514" },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
  },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const subPath = path.join("/");

  if (subPath !== "chat/completions") {
    return NextResponse.json({ error: "Unsupported endpoint" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(`llm-proxy:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: config } = await supabase
    .from("AgentConfig")
    .select("llmProvider, llmApiKeyEncrypted, isActive")
    .eq("userId", user.id)
    .single();

  if (!config?.isActive || !config.llmApiKeyEncrypted) {
    return NextResponse.json(
      { error: "AI agent not configured — add an LLM key in Settings" },
      { status: 403 }
    );
  }

  const provider = PROVIDERS[config.llmProvider as string];
  if (!provider) {
    return NextResponse.json(
      { error: `Provider ${config.llmProvider} not supported for the page agent` },
      { status: 400 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(config.llmApiKeyEncrypted);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt API key. Check encryption configuration." },
      { status: 500 }
    );
  }

  const body = await req.json();
  body.model = provider.model;

  const upstream = await fetch(`${provider.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
