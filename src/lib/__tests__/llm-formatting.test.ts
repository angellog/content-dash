import { describe, it, expect, vi, beforeAll } from "vitest";
import type { AgentMessage } from "../llm";

describe("OpenAI message formatting", () => {
  async function formatForOpenAI(messages: AgentMessage[]) {
    const { callLLM, SYSTEM_PROMPT } = await import("../llm");
    const tools = [
      {
        name: "test_tool",
        description: "A test tool",
        parameters: { type: "object", properties: { input: { type: "string" } } },
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: { content: "done", tool_calls: [] },
              finish_reason: "stop",
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );

    try {
      await callLLM("openai", "fake-key", messages, tools);
    } catch {}

    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string ?? "{}");
    fetchSpy.mockRestore();
    return body.messages;
  }

  beforeAll(() => {
    process.env.OMNISOCIAL_ENCRYPTION_KEY = "test-key-at-least-16-chars";
  });

  it("includes tool_calls array in assistant message when present", async () => {
    const messages: AgentMessage[] = [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "do something" },
      {
        role: "assistant",
        content: "",
        toolCalls: [{ id: "call_1", name: "test_tool", arguments: { input: "hello" } }],
      },
      { role: "tool", content: "result", toolCallId: "call_1", toolCallName: "test_tool" },
    ];

    const formatted = await formatForOpenAI(messages);
    const assistantMsg = formatted.find((m: Record<string, unknown>) => m.role === "assistant" && "tool_calls" in m) as Record<string, unknown> & { tool_calls: { function: { name: string } }[] };
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg.tool_calls).toHaveLength(1);
    expect(assistantMsg.tool_calls[0].function.name).toBe("test_tool");
  });

  it("includes tool_call_id on tool messages", async () => {
    const messages: AgentMessage[] = [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "test" },
      { role: "tool", content: "result data", toolCallId: "call_abc" },
    ];

    const formatted = await formatForOpenAI(messages);
    const toolMsg = formatted.find((m: Record<string, unknown>) => m.role === "tool") as Record<string, unknown> & { tool_call_id: string };
    expect(toolMsg).toBeDefined();
    expect(toolMsg.tool_call_id).toBe("call_abc");
  });
});

describe("Anthropic message formatting", () => {
  async function formatForAnthropic(messages: AgentMessage[]) {
    const { callLLM } = await import("../llm");
    const tools = [
      {
        name: "test_tool",
        description: "A test tool",
        parameters: { type: "object", properties: { input: { type: "string" } } },
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: "text", text: "done" }],
          stop_reason: "end_turn",
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );

    try {
      await callLLM("anthropic", "fake-key", messages, tools);
    } catch {}

    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string ?? "{}");
    fetchSpy.mockRestore();
    return body.messages;
  }

  it("includes tool_use content blocks in assistant message", async () => {
    const messages: AgentMessage[] = [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "do something" },
      {
        role: "assistant",
        content: "I will use a tool",
        toolCalls: [{ id: "tu_1", name: "test_tool", arguments: { input: "hello" } }],
      },
      { role: "tool", content: "tool output", toolCallId: "tu_1", toolCallName: "test_tool" },
    ];

    const formatted = await formatForAnthropic(messages);
    const assistantMsg = formatted.find((m: Record<string, unknown>) => m.role === "assistant" && Array.isArray(m.content)) as Record<string, unknown> & { content: Record<string, unknown>[] };
    expect(assistantMsg).toBeDefined();
    const toolUseBlock = assistantMsg.content.find((b: Record<string, unknown>) => b.type === "tool_use") as Record<string, unknown> & { name: string; id: string };
    expect(toolUseBlock).toBeDefined();
    expect(toolUseBlock.name).toBe("test_tool");
    expect(toolUseBlock.id).toBe("tu_1");
  });

  it("wraps tool results as user messages with tool_result type", async () => {
    const messages: AgentMessage[] = [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "test" },
      { role: "tool", content: "output data", toolCallId: "tu_1", toolCallName: "test_tool" },
    ];

    const formatted = await formatForAnthropic(messages);
    const toolResultMsg = formatted.find((m: Record<string, unknown>) => m.role === "user" && Array.isArray(m.content)) as Record<string, unknown> & { content: Record<string, unknown>[] };
    expect(toolResultMsg).toBeDefined();
    const block = toolResultMsg.content.find((b: Record<string, unknown>) => b.type === "tool_result") as Record<string, unknown> & { tool_use_id: string };
    expect(block).toBeDefined();
    expect(block.tool_use_id).toBe("tu_1");
  });
});

describe("Gemini message formatting", () => {
  async function formatForGemini(messages: AgentMessage[]) {
    const { callLLM } = await import("../llm");
    const tools = [
      {
        name: "test_tool",
        description: "A test tool",
        parameters: { type: "object", properties: { input: { type: "string" } } },
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "done" }] }, finishReason: "STOP" }],
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );

    try {
      await callLLM("gemini", "fake-key", messages, tools);
    } catch {}

    const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string ?? "{}");
    fetchSpy.mockRestore();
    return body.contents;
  }

  it("includes functionCall parts in model message", async () => {
    const messages: AgentMessage[] = [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "do something" },
      {
        role: "assistant",
        content: "",
        toolCalls: [{ id: "gc_1", name: "test_tool", arguments: { input: "hello" } }],
      },
      { role: "tool", content: "tool result", toolCallId: "gc_1", toolCallName: "test_tool" },
    ];

    const contents = await formatForGemini(messages);
    const modelMsg = contents.find((c: Record<string, unknown>) => c.role === "model" && Array.isArray(c.parts) && (c.parts as Record<string, unknown>[]).some((p) => "functionCall" in p)) as Record<string, unknown> & { parts: Record<string, unknown>[] };
    expect(modelMsg).toBeDefined();
    const fcPart = modelMsg.parts.find((p: Record<string, unknown>) => "functionCall" in p) as Record<string, unknown> & { functionCall: { name: string } };
    expect(fcPart.functionCall.name).toBe("test_tool");
  });

  it("uses functionResponse parts for tool results", async () => {
    const messages: AgentMessage[] = [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "test" },
      { role: "tool", content: "output data", toolCallId: "gc_1", toolCallName: "test_tool" },
    ];

    const contents = await formatForGemini(messages);
    const toolMsg = contents.find((c: Record<string, unknown>) => c.role === "user" && Array.isArray(c.parts) && (c.parts as Record<string, unknown>[]).some((p) => "functionResponse" in p)) as Record<string, unknown> & { parts: Record<string, unknown>[] };
    expect(toolMsg).toBeDefined();
    const frPart = toolMsg.parts.find((p: Record<string, unknown>) => "functionResponse" in p) as Record<string, unknown> & { functionResponse: { name: string; response: { content: string } } };
    expect(frPart.functionResponse.name).toBe("test_tool");
    expect(frPart.functionResponse.response.content).toBe("output data");
  });
});
