export type LLMProvider = "openai" | "anthropic" | "gemini" | "hermes";

export interface HermesConfig {
  endpointUrl: string;
  apiKey?: string;
}

export type AgentFramework = "openclaw" | "hermes";

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

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCallName?: string;
  toolCalls?: ToolCall[];
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
  messages: AgentMessage[],
  tools: ToolDefinition[]
): Promise<LLMResponse> {
  switch (provider) {
    case "openai":
      return callOpenAI(apiKey, messages, tools);
    case "anthropic":
      return callAnthropic(apiKey, messages, tools);
    case "gemini":
      return callGemini(apiKey, messages, tools);
    case "hermes":
      throw new Error("Use callHermesAgent() for Hermes framework");
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

export async function callHermesAgent(
  config: HermesConfig,
  messages: AgentMessage[],
  tools: ToolDefinition[]
): Promise<LLMResponse> {
  const toolsJson = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const functionCallSchema = JSON.stringify({
    title: "FunctionCall",
    type: "object",
    properties: {
      name: { title: "Name", type: "string" },
      arguments: { title: "Arguments", type: "object" },
    },
    required: ["name", "arguments"],
  });

  const systemContent = `You are a function calling AI model. You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. If available tools are not relevant in assisting with user query, just respond in natural conversational language. Don't make assumptions about what values to plug into functions. After calling & executing the functions, you will be provided with function results within <tool_response></tool_response> XML tags.\n<tools>\n${JSON.stringify(toolsJson)}\n</tools>\nFor each function call return a JSON object, with the following pydantic model json schema:\n${functionCallSchema}\nEach function call should be enclosed within <tool_call>\n</tool_call> XML tags.\nYou must use <scratch_pad>\n</scratch_pad> XML tags to record your reasoning and planning before you call the functions as follows:\nExample:\n<scratch_pad>\nGoal: <state task assigned by user>\nActions:\n<if tool calls need to be generated:>\n- {result_var_name1} = functions.{function_name1}({param1}={value1},...)\n<if no tool call needs to be generated:> None\nObservation: <set observation 'None' with tool calls; plan final tools results summary when provided>\nReflection: <evaluate query-tool relevance and required parameters when tools called; analyze overall task status when observations made>\n</scratch_pad>`;

  const chatmlMessages = buildChatMLMessages(systemContent, messages);

  const baseUrl = config.endpointUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/v1/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "hermes",
      messages: chatmlMessages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hermes endpoint error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const assistantContent = data.choices?.[0]?.message?.content ?? "";

  return parseHermesResponse(assistantContent);
}

function buildChatMLMessages(
  systemContent: string,
  messages: AgentMessage[]
): { role: string; content: string }[] {
  const result: { role: string; content: string }[] = [];

  result.push({ role: "system", content: systemContent });

  for (const m of messages) {
    if (m.role === "system") continue;

    if (m.role === "assistant" && m.toolCalls?.length) {
      let content = m.content || "";
      for (const tc of m.toolCalls) {
        content += `\n<tool_call>\n${JSON.stringify({ name: tc.name, arguments: tc.arguments })}\n</tool_call>`;
      }
      result.push({ role: "assistant", content });
    } else if (m.role === "tool") {
      result.push({
        role: "tool",
        content: `<tool_response>\n${JSON.stringify({ name: m.toolCallName, content: m.content })}\n</tool_response>`,
      });
    } else {
      result.push({ role: m.role, content: m.content });
    }
  }

  return result;
}

function parseHermesResponse(content: string): LLMResponse {
  const toolCallRegex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
  const toolCalls: ToolCall[] = [];
  let match: RegExpExecArray | null;

  while ((match = toolCallRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      toolCalls.push({
        id: `hermes-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: parsed.name,
        arguments: parsed.arguments ?? {},
      });
    } catch {}
  }

  const textContent = content
    .replace(/<scratch_pad>[\s\S]*?<\/scratch_pad>/g, "")
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "")
    .trim() || null;

  return {
    content: textContent,
    toolCalls,
    finishReason: toolCalls.length > 0 ? "tool_calls" : "stop",
  };
}

async function callOpenAI(
  apiKey: string,
  messages: AgentMessage[],
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

  const formattedMessages = messages.map((m) => {
    if (m.role === "assistant" && m.toolCalls?.length) {
      return {
        role: "assistant" as const,
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      };
    }
    if (m.role === "tool") {
      return {
        role: "tool" as const,
        content: m.content,
        tool_call_id: m.toolCallId,
      };
    }
    return {
      role: m.role,
      content: m.content,
    };
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: formattedMessages,
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
  messages: AgentMessage[],
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
    if (m.role === "assistant" && m.toolCalls?.length) {
      const content: Record<string, unknown>[] = [];
      if (m.content) {
        content.push({ type: "text", text: m.content });
      }
      for (const tc of m.toolCalls) {
        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.name,
          input: tc.arguments,
        });
      }
      formattedMessages.push({ role: "assistant", content });
    } else if (m.role === "assistant") {
      formattedMessages.push({ role: "assistant", content: m.content });
    } else if (m.role === "tool") {
      formattedMessages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: m.toolCallId,
            content: m.content,
          },
        ],
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
  messages: AgentMessage[],
  tools: ToolDefinition[]
): Promise<LLMResponse> {
  const geminiTools = tools.map((t) => ({
    functionDeclarations: [
      {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    ],
  }));

  const contents: Record<string, unknown>[] = [];
  for (const m of messages) {
    if (m.role === "system") continue;

    if (m.role === "assistant" && m.toolCalls?.length) {
      const parts: Record<string, unknown>[] = [];
      if (m.content) {
        parts.push({ text: m.content });
      }
      for (const tc of m.toolCalls) {
        parts.push({
          functionCall: { name: tc.name, args: tc.arguments },
        });
      }
      contents.push({ role: "model", parts });
    } else if (m.role === "tool") {
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: m.toolCallName,
              response: { content: m.content },
            },
          },
        ],
      });
    } else if (m.role === "assistant") {
      contents.push({ role: "model", parts: [{ text: m.content }] });
    } else {
      contents.push({ role: "user", parts: [{ text: m.content }] });
    }
  }

  const systemInstruction = messages.find((m) => m.role === "system")
    ?.content;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
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
