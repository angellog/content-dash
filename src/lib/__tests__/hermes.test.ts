import { describe, it, expect, vi, beforeAll } from "vitest";
import type { AgentMessage } from "../llm";

describe("Hermes ChatML message formatting", () => {
  async function formatForHermes(messages: AgentMessage[]) {
    const { callHermesAgent } = await import("../llm");
    const tools = [
      {
        name: "fetch_news",
        description: "Fetch news articles",
        parameters: { type: "object", properties: { topic: { type: "string" } } },
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: { content: "I fetched the news for you." },
              finish_reason: "stop",
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );

    try {
      await callHermesAgent(
        { endpointUrl: "http://localhost:11434", apiKey: "test-key" },
        messages,
        tools
      );
    } catch {}

    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string ?? "{}");
    const url = fetchSpy.mock.calls[0]?.[0] as string;
    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>;
    fetchSpy.mockRestore();
    return { url, headers, messages: body.messages };
  }

  beforeAll(() => {
    process.env.OMNISOCIAL_ENCRYPTION_KEY = "test-key-at-least-16-chars";
  });

  it("sends request to /v1/chat/completions endpoint", async () => {
    const { url } = await formatForHermes([
      { role: "system", content: "You are helpful" },
      { role: "user", content: "test" },
    ]);
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
  });

  it("includes Authorization header when API key is provided", async () => {
    const { headers } = await formatForHermes([
      { role: "system", content: "You are helpful" },
      { role: "user", content: "test" },
    ]);
    expect(headers["Authorization"]).toBe("Bearer test-key");
  });

  it("does not include Authorization header when no API key", async () => {
    const { callHermesAgent } = await import("../llm");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "done" }, finish_reason: "stop" }],
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );

    try {
      await callHermesAgent(
        { endpointUrl: "http://localhost:11434" },
        [{ role: "system", content: "test" }, { role: "user", content: "hi" }],
        []
      );
    } catch {}

    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>;
    fetchSpy.mockRestore();
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("includes tools in system prompt with XML tags", async () => {
    const { messages } = await formatForHermes([
      { role: "system", content: "You are helpful" },
      { role: "user", content: "test" },
    ]);
    const systemMsg = messages.find((m: Record<string, unknown>) => m.role === "system") as Record<string, unknown> & { content: string };
    expect(systemMsg).toBeDefined();
    expect(systemMsg.content).toContain("<tools>");
    expect(systemMsg.content).toContain("</tools>");
    expect(systemMsg.content).toContain("fetch_news");
  });

  it("formats tool calls in assistant messages with tool_call XML tags", async () => {
    const { messages } = await formatForHermes([
      { role: "system", content: "You are helpful" },
      { role: "user", content: "get news" },
      {
        role: "assistant",
        content: "",
        toolCalls: [{ id: "tc_1", name: "fetch_news", arguments: { topic: "AI" } }],
      },
    ]);
    const assistantMsg = messages.find(
      (m: Record<string, unknown>) => m.role === "assistant" && typeof m.content === "string" && (m.content as string).includes("tool_call")
    ) as Record<string, unknown> & { content: string };
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg.content).toContain("fetch_news");
    expect(assistantMsg.content).toContain('"topic"');
  });

  it("formats tool results with tool_response XML tags", async () => {
    const { messages } = await formatForHermes([
      { role: "system", content: "You are helpful" },
      { role: "user", content: "get news" },
      {
        role: "tool",
        content: "No articles found",
        toolCallId: "tc_1",
        toolCallName: "fetch_news",
      },
    ]);
    const toolMsg = messages.find((m: Record<string, unknown>) => m.role === "tool") as Record<string, unknown> & { content: string };
    expect(toolMsg).toBeDefined();
    expect(toolMsg.content).toContain("tool_response");
    expect(toolMsg.content).toContain("fetch_news");
    expect(toolMsg.content).toContain("No articles found");
  });

  it("strips trailing slashes from endpoint URL", async () => {
    const { callHermesAgent } = await import("../llm");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "done" }, finish_reason: "stop" }],
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );

    try {
      await callHermesAgent(
        { endpointUrl: "http://localhost:11434///" },
        [{ role: "system", content: "test" }, { role: "user", content: "hi" }],
        []
      );
    } catch {}

    const url = fetchSpy.mock.calls[0]?.[0] as string;
    fetchSpy.mockRestore();
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
  });
});

describe("Hermes response parsing", () => {
  async function parseHermesResponse(assistantContent: string) {
    const { callHermesAgent } = await import("../llm");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: { content: assistantContent },
              finish_reason: "stop",
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await callHermesAgent(
      { endpointUrl: "http://localhost:11434" },
      [{ role: "system", content: "test" }, { role: "user", content: "hi" }],
      []
    );
    fetchSpy.mockRestore();
    return result;
  }

  it("parses tool_call XML blocks into ToolCall array", async () => {
    const response = await parseHermesResponse(
      '<scratch_pad>Goal: fetch news\nActions: None</scratch_pad>\n<tool_call>\n{"name": "fetch_news", "arguments": {"topic": "AI"}}\n</tool_call>'
    );
    expect(response.toolCalls).toHaveLength(1);
    expect(response.toolCalls[0].name).toBe("fetch_news");
    expect(response.toolCalls[0].arguments).toEqual({ topic: "AI" });
    expect(response.toolCalls[0].id).toMatch(/^hermes-/);
  });

  it("parses multiple tool calls", async () => {
    const response = await parseHermesResponse(
      '<tool_call>\n{"name": "fetch_news", "arguments": {"topic": "AI"}}\n</tool_call>\n<tool_call>\n{"name": "fetch_news", "arguments": {"topic": "marketing"}}\n</tool_call>'
    );
    expect(response.toolCalls).toHaveLength(2);
    expect(response.toolCalls[0].arguments.topic).toBe("AI");
    expect(response.toolCalls[1].arguments.topic).toBe("marketing");
  });

  it("extracts text content without scratch_pad and tool_call tags", async () => {
    const response = await parseHermesResponse(
      '<scratch_pad>Planning...</scratch_pad>\nI found some articles for you.\n<tool_call>\n{"name": "fetch_news", "arguments": {"topic": "AI"}}\n</tool_call>'
    );
    expect(response.content).toBe("I found some articles for you.");
  });

  it("returns null content when only tool calls present", async () => {
    const response = await parseHermesResponse(
      '<tool_call>\n{"name": "fetch_news", "arguments": {"topic": "AI"}}\n</tool_call>'
    );
    expect(response.content).toBeNull();
  });

  it("returns empty tool calls for plain text response", async () => {
    const response = await parseHermesResponse(
      "I don't need any tools for this request."
    );
    expect(response.toolCalls).toHaveLength(0);
    expect(response.content).toBe("I don't need any tools for this request.");
    expect(response.finishReason).toBe("stop");
  });

  it("sets finishReason to tool_calls when tool calls present", async () => {
    const response = await parseHermesResponse(
      '<tool_call>\n{"name": "fetch_news", "arguments": {"topic": "AI"}}\n</tool_call>'
    );
    expect(response.finishReason).toBe("tool_calls");
  });
});
