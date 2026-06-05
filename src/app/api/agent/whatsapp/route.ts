import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createHmac, timingSafeEqual } from "crypto";
import { decrypt } from "@/lib/encryption";
import { callLLM, SYSTEM_PROMPT, LLMProvider, AgentMessage } from "@/lib/llm";
import { AGENT_TOOLS, AgentToolName } from "../tools";
import { executeTool } from "../executor";

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

async function validateTwilioSignatureAsync(req: NextRequest, formData: FormData): Promise<boolean> {
  if (!TWILIO_AUTH_TOKEN) return false;

  const signature = req.headers.get("x-twilio-signature");
  if (!signature) return false;

  const url = `${process.env.NEXT_PUBLIC_APP_URL}${req.nextUrl.pathname}`;

  const sortedParams: string[] = [];
  const entries = Array.from(formData.entries()).sort(([a], [b]) => a.localeCompare(b));
  for (const [key, value] of entries) {
    sortedParams.push(key + (value as string));
  }
  const data = url + sortedParams.join("");

  const expected = createHmac("sha1", TWILIO_AUTH_TOKEN).update(data).digest("base64");

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  if (!await validateTwilioSignatureAsync(req, formData)) {
    return NextResponse.json({ error: "Invalid Twilio signature" }, { status: 401 });
  }

  const from = formData.get("From") as string;
  const body = formData.get("Body") as string;
  const profileName = formData.get("ProfileName") as string;

  if (!from || !body) {
    return new Response("Missing From or Body", { status: 400 });
  }

  const phoneNumber = from.replace("whatsapp:", "");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  const matchedNumber = `whatsapp:${phoneNumber}`;

  const { data: agentConfigRow } = await supabase
    .from("AgentConfig")
    .select("userId, isActive, twilioWhatsappNumber, llmProvider, llmApiKeyEncrypted")
    .eq("isActive", true)
    .eq("twilioWhatsappNumber", matchedNumber)
    .single();

  if (!agentConfigRow) {
    return new Response(generateTwiml("No agent configured for this WhatsApp number. Please configure it in ContentDash settings."), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (!agentConfigRow.llmApiKeyEncrypted) {
    return new Response(generateTwiml("LLM not configured. Add your API key in ContentDash settings."), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  let llmApiKey: string;
  try {
    llmApiKey = decrypt(agentConfigRow.llmApiKeyEncrypted);
  } catch {
    return new Response(generateTwiml("Failed to decrypt LLM API key. Check encryption configuration."), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const { data: omniConfig } = await supabase
    .from("OmniSocialConfig")
    .select("apiKeyEncrypted, status")
    .eq("userId", agentConfigRow.userId)
    .single();

  let omniSocialApiKey = "";
  if (omniConfig?.status === "ACTIVE" && omniConfig.apiKeyEncrypted) {
    try {
      omniSocialApiKey = decrypt(omniConfig.apiKeyEncrypted);
    } catch {
      return new Response(generateTwiml("Failed to decrypt OmniSocial API key. Check encryption configuration."), {
        headers: { "Content-Type": "text/xml" },
      });
    }
  }

  const provider = (agentConfigRow.llmProvider as LLMProvider) || "openai";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const messages: AgentMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: body },
  ];

  const MAX_ITERATIONS = 8;
  const allToolCalls: Record<string, unknown>[] = [];
  let finalContent = "";
  let iteration = 0;

  try {
    while (iteration < MAX_ITERATIONS) {
      iteration++;

      const response = await callLLM(provider, llmApiKey, messages, AGENT_TOOLS);

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
          agentConfigRow.userId
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

    if (!finalContent && allToolCalls.length > 0) {
      const lastTool = allToolCalls[allToolCalls.length - 1];
      finalContent = `Executed: ${lastTool.name}. Result: ${typeof lastTool.result === "string" ? lastTool.result : JSON.stringify(lastTool.result)}`;
    }

    await supabase.from("AgentLog").insert({
      id: crypto.randomUUID(),
      userId: agentConfigRow.userId,
      source: "whatsapp",
      intent: body,
      toolCalls: allToolCalls,
      result: finalContent,
      status: "completed",
    });

    const reply = finalContent || "Action completed but no response generated.";

    return new Response(generateTwiml(reply), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    try {
      await supabase.from("AgentLog").insert({
        id: crypto.randomUUID(),
        userId: agentConfigRow.userId,
        source: "whatsapp",
        intent: body,
        toolCalls: allToolCalls,
        result: finalContent,
        status: "failed",
      });
    } catch {}

    return new Response(
      generateTwiml("Failed to process your request. Please try again later."),
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}

function generateTwiml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
