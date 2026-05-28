export type LLMProvider = "openai" | "anthropic" | "gemini";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMResponse {
  content: string | null;
  toolCalls: ToolCall[];
  finishReason: string;
}

const SYSTEM_PROMPT = `You are the OpenClaw AI agent for ContentDash — a content management dashboard powered by OmniSocial.

Your role: Receive natural language commands (often from WhatsApp) and execute them by calling the appropriate tools.

Available capabilities:
- Fetch and summarize news/trending topics from RSS feeds
- Create and schedule social media posts via OmniSocial (Instagram, Facebook, LinkedIn, TikTok, X, Threads, YouTube, Pinterest, Bluesky, Mastodon)
- Create WhatsApp billboard campaigns
- Add competitor brands to the watch list
- Get analytics summaries
- Manage NFC card configurations

Rules:
1. Always use tools to fulfill requests — never refuse a reasonable request.
2. When asked to "post about X", first fetch news on X, then generate engaging content tailored to the platform, then post it.
3. For Instagram carousels, generate 3-5 slide captions in the post text, separated by "---SLIDE---".
4. Keep social media content punchy, emoji-rich, and hashtag-optimized.
5. Always confirm what you did in your final response.
6. If a tool call fails, report the error clearly and suggest next steps.`;

export { SYSTEM_PROMPT };

export async function callLLM(
  provider: LLMProvider,
  apiKey: string,
  messages: { role: "system" | "user" | "assistant" | "tool"; content: string; toolCallId?: string }[],
  tools: ToolDefinition[]
): Promise<LLMResponse> {
  switch (provider) {
    case "openai":
      return callOpenAI(apiKey, messages, tools);
    case "anthropic":
      return callAnthropic(apiKey, messages, tools);
    case "gemini":
      return callGemini(apiKey, messages, tools);
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

async function callOpenAI(
  apiKey: string,
  messages: { role: string; content: string; toolCallId?: string }[],
  tools: ToolDefinition[]
): Promise<LLMResponse> {
  const openaiTools = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messages.map((m) => ({
        role: m.role === "tool" ? "tool" : m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
      })),
      tools: openaiTools.length > 0 ? openaiTools : undefined,
      tool_choice: openaiTools.length > 0 ? "auto" : undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];

  const toolCalls: ToolCall[] = (choice?.message?.tool_calls || []).map(
    (tc: { id: string; function: { name: string; arguments: string } }) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    })
  );

  return {
    content: choice?.message?.content ?? null,
    toolCalls,
    finishReason: choice?.finish_reason ?? "stop",
  };
}

async function callAnthropic(
  apiKey: string,
  messages: { role: string; content: string; toolCallId?: string }[],
  tools: ToolDefinition[]
): Promise<LLMResponse> {
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const nonSystem = messages.filter((m) => m.role !== "system");

  const anthropicTools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));

  const formattedMessages: Record<string, unknown>[] = [];
  for (const m of nonSystem) {
    if (m.role === "assistant") {
      formattedMessages.push({ role: "assistant", content: m.content });
    } else if (m.role === "tool") {
      formattedMessages.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: m.toolCallId, content: m.content }],
      });
    } else {
      formattedMessages.push({ role: m.role, content: m.content });
    }
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemMsg,
      messages: formattedMessages,
      tools: anthropicTools.length > 0 ? anthropicTools : undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const contentBlocks = data.content ?? [];

  let textContent: string | null = null;
  const toolCalls: ToolCall[] = [];

  for (const block of contentBlocks) {
    if (block.type === "text") {
      textContent = block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        name: block.name,
        arguments: block.input,
      });
    }
  }

  return {
    content: textContent,
    toolCalls,
    finishReason: data.stop_reason ?? "end_turn",
  };
}

async function callGemini(
  apiKey: string,
  messages: { role: string; content: string; toolCallId?: string }[],
  tools: ToolDefinition[]
): Promise<LLMResponse> {
  const geminiTools = tools.map((t) => ({
    functionDeclarations: [{
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }],
  }));

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : m.role === "tool" ? "user" : "user",
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m) => m.role === "system")?.content;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        contents,
        tools: geminiTools.length > 0 ? geminiTools : undefined,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];

  let textContent: string | null = null;
  const toolCalls: ToolCall[] = [];

  for (const part of parts) {
    if (part.text) {
      textContent = part.text;
    } else if (part.functionCall) {
      toolCalls.push({
        id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: part.functionCall.name,
        arguments: part.functionCall.args,
      });
    }
  }

  return {
    content: textContent,
    toolCalls,
    finishReason: candidate?.finishReason ?? "STOP",
  };
}
