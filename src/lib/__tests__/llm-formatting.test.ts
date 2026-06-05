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
    const assistantMsg = formatted.find((m: any) => m.role === "assistant" && m.tool_calls);
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
    const toolMsg = formatted.find((m: any) => m.role === "tool");
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
    const assistantMsg = formatted.find((m: any) => m.role === "assistant" && Array.isArray(m.content));
    expect(assistantMsg).toBeDefined();
    const toolUseBlock = assistantMsg.content.find((b: any) => b.type === "tool_use");
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
    const toolResultMsg = formatted.find((m: any) => m.role === "user" && Array.isArray(m.content));
    expect(toolResultMsg).toBeDefined();
    const block = toolResultMsg.content.find((b: any) => b.type === "tool_result");
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
    const modelMsg = contents.find((c: any) => c.role === "model" && c.parts.some((p: any) => p.functionCall));
    expect(modelMsg).toBeDefined();
    const fcPart = modelMsg.parts.find((p: any) => p.functionCall);
    expect(fcPart.functionCall.name).toBe("test_tool");
  });

  it("uses functionResponse parts for tool results", async () => {
    const messages: AgentMessage[] = [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "test" },
      { role: "tool", content: "output data", toolCallId: "gc_1", toolCallName: "test_tool" },
    ];

    const contents = await formatForGemini(messages);
    const toolMsg = contents.find((c: any) => c.role === "user" && c.parts.some((p: any) => p.functionResponse));
    expect(toolMsg).toBeDefined();
    const frPart = toolMsg.parts.find((p: any) => p.functionResponse);
    expect(frPart.functionResponse.name).toBe("test_tool");
    expect(frPart.functionResponse.response.content).toBe("output data");
  });
});
