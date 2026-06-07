import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import { callLLM, callHermesAgent, SYSTEM_PROMPT, LLMProvider, HermesConfig, AgentMessage } from "@/lib/llm";
import { AGENT_TOOLS, AgentToolName } from "../tools";
import { executeTool } from "../executor";
import { agentExecuteSchema, validateBody } from "@/lib/validations/schemas";
import { rateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";

const MAX_ITERATIONS = 8;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(ip, RATE_LIMITS.agentExecute.limit, RATE_LIMITS.agentExecute.windowMs);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = validateBody(agentExecuteSchema, body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { message, source } = parsed.data;

  const { data: agentConfig } = await supabase
    .from("AgentConfig")
    .select("llmProvider, llmApiKeyEncrypted, isActive, agentFramework, hermesEndpointUrl, hermesApiKeyEncrypted")
    .eq("userId", user.id)
    .single();

  if (!agentConfig?.isActive) {
    return NextResponse.json({ error: "AI agent not configured" }, { status: 403 });
  }

  const framework = (agentConfig.agentFramework as "openclaw" | "hermes") || "openclaw";

  let llmApiKey: string;
  try {
    if (framework === "hermes") {
      llmApiKey = agentConfig.hermesApiKeyEncrypted ? decrypt(agentConfig.hermesApiKeyEncrypted) : "";
    } else {
      llmApiKey = decrypt(agentConfig.llmApiKeyEncrypted);
    }
  } catch {
    return NextResponse.json({ error: "Failed to decrypt API key. Check encryption configuration." }, { status: 500 });
  }

  const messages: AgentMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: message },
  ];

  const allToolCalls: Record<string, unknown>[] = [];
  let finalContent = "";
  let iteration = 0;

  const hermesConfig: HermesConfig | null = framework === "hermes" ? {
    endpointUrl: agentConfig.hermesEndpointUrl || process.env.HERMES_DEFAULT_ENDPOINT_URL || "",
    apiKey: llmApiKey || undefined,
  } : null;

  if (framework === "hermes" && !hermesConfig?.endpointUrl) {
    return NextResponse.json({ error: "Hermes endpoint URL not configured" }, { status: 400 });
  }

  const { data: omniConfig } = await supabase
    .from("OmniSocialConfig")
    .select("apiKeyEncrypted, status")
    .eq("userId", user.id)
    .single();

  let omniSocialApiKey = "";
  if (omniConfig?.status === "ACTIVE" && omniConfig.apiKeyEncrypted) {
    try {
      omniSocialApiKey = decrypt(omniConfig.apiKeyEncrypted);
    } catch {
      return NextResponse.json({ error: "Failed to decrypt OmniSocial API key. Check encryption configuration." }, { status: 500 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    while (iteration < MAX_ITERATIONS) {
      iteration++;

      const response = framework === "hermes" && hermesConfig
        ? await callHermesAgent(hermesConfig, messages, AGENT_TOOLS)
        : await callLLM((agentConfig.llmProvider as LLMProvider) || "openai", llmApiKey, messages, AGENT_TOOLS);

      if (response.content) {
        finalContent = response.content;
      }

      if (response.toolCalls.length === 0) {
        break;
      }

      const assistantToolCalls = response.toolCalls;

      messages.push({
        role: "assistant",
        content: response.content || "",
        toolCalls: assistantToolCalls,
      });

      for (const tc of response.toolCalls) {
        const toolResult = await executeTool(
          tc.name as AgentToolName,
          tc.arguments,
          omniSocialApiKey,
          supabaseUrl,
          serviceKey,
          user.id
        );

        allToolCalls.push({
          name: tc.name,
          arguments: tc.arguments,
          result: toolResult,
        });

        messages.push({
          role: "tool",
          content: toolResult,
          toolCallId: tc.id,
          toolCallName: tc.name,
        });
      }

      if (response.finishReason === "stop" || response.finishReason === "end_turn") {
        break;
      }
    }
  } catch (err) {
    try {
      await supabase.from("AgentLog").insert({
        id: crypto.randomUUID(),
        userId: user.id,
        source,
        intent: message,
        toolCalls: allToolCalls,
        result: finalContent,
        status: "failed",
      });
    } catch {}

    return NextResponse.json({
      error: err instanceof Error ? err.message : "Agent execution failed",
      toolCalls: allToolCalls,
      iterations: iteration,
    }, { status: 500 });
  }

  if (!finalContent && allToolCalls.length > 0) {
    const lastTool = allToolCalls[allToolCalls.length - 1];
    finalContent = `Executed: ${lastTool.name}. Result: ${typeof lastTool.result === "string" ? lastTool.result : JSON.stringify(lastTool.result)}`;
  }

  await supabase.from("AgentLog").insert({
    id: crypto.randomUUID(),
    userId: user.id,
    source,
    intent: message,
    toolCalls: allToolCalls,
    result: finalContent,
    status: "completed",
  });

  return NextResponse.json({
    response: finalContent,
    toolCalls: allToolCalls,
    iterations: iteration,
  });
}
