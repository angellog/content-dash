import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import { callLLM, SYSTEM_PROMPT, LLMProvider } from "@/lib/llm";
import { AGENT_TOOLS, AgentToolName } from "../tools";
import { executeTool } from "../executor";

const MAX_ITERATIONS = 8;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { message, source = "web" } = body;
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const { data: agentConfig } = await supabase
    .from("AgentConfig")
    .select("llmProvider, llmApiKeyEncrypted, isActive")
    .eq("userId", user.id)
    .single();

  if (!agentConfig?.isActive) {
    return NextResponse.json({ error: "AI agent not configured" }, { status: 403 });
  }

  let llmApiKey: string;
  try {
    llmApiKey = decrypt(agentConfig.llmApiKeyEncrypted);
  } catch {
    llmApiKey = agentConfig.llmApiKeyEncrypted;
  }

  const provider = (agentConfig.llmProvider as LLMProvider) || "openai";

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
      omniSocialApiKey = omniConfig.apiKeyEncrypted;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const messages: { role: "system" | "user" | "assistant" | "tool"; content: string; toolCallId?: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: message },
  ];

  const allToolCalls: Record<string, unknown>[] = [];
  let finalContent = "";
  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    const response = await callLLM(provider, llmApiKey, messages, AGENT_TOOLS);

    if (response.content) {
      finalContent = response.content;
    }

    if (response.toolCalls.length === 0) {
      break;
    }

    for (const tc of response.toolCalls) {
      const toolResult = await executeTool(
        tc.name as AgentToolName,
        tc.arguments,
        omniSocialApiKey,
        supabaseUrl,
        serviceKey
      );

      allToolCalls.push({
        name: tc.name,
        arguments: tc.arguments,
        result: toolResult,
      });

      messages.push({
        role: "assistant",
        content: "",
        toolCallId: tc.id,
      });

      messages.push({
        role: "tool",
        content: toolResult,
        toolCallId: tc.id,
      });
    }

    if (response.finishReason === "stop" || response.finishReason === "end_turn") {
      break;
    }
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
