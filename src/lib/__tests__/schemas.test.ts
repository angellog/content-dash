import { describe, it, expect } from "vitest";
import {
  agentExecuteSchema,
  agentConfigPutSchema,
  paymentPostSchema,
  nfcCardPostSchema,
  nfcCardPatchSchema,
  whatsappCampaignPostSchema,
  competitorPostSchema,
  omnisocialConfigPutSchema,
  validateBody,
} from "../validations/schemas";

describe("validateBody helper", () => {
  it("should return data on valid input", () => {
    const result = validateBody(agentExecuteSchema, { message: "hello" });
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.message).toBe("hello");
    }
  });

  it("should return error on invalid input", () => {
    const result = validateBody(agentExecuteSchema, {});
    expect("error" in result).toBe(true);
  });
});

describe("agentExecuteSchema", () => {
  it("accepts valid message", () => {
    const result = agentExecuteSchema.safeParse({ message: "post about AI" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = agentExecuteSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });

  it("defaults source to web", () => {
    const result = agentExecuteSchema.safeParse({ message: "test" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.source).toBe("web");
  });

  it("rejects invalid source", () => {
    const result = agentExecuteSchema.safeParse({ message: "test", source: "sms" });
    expect(result.success).toBe(false);
  });
});

describe("agentConfigPutSchema", () => {
  it("accepts valid config", () => {
    const result = agentConfigPutSchema.safeParse({ llmProvider: "anthropic", llmApiKey: "sk-test" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid provider", () => {
    const result = agentConfigPutSchema.safeParse({ llmProvider: "cohere" });
    expect(result.success).toBe(false);
  });
});

describe("paymentPostSchema", () => {
  it("accepts valid card color", () => {
    const result = paymentPostSchema.safeParse({ cardColor: "matte-black" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid card color", () => {
    const result = paymentPostSchema.safeParse({ cardColor: "hot-pink" });
    expect(result.success).toBe(false);
  });

  it("rejects quantity over 100", () => {
    const result = paymentPostSchema.safeParse({ cardColor: "matte-black", quantity: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = paymentPostSchema.safeParse({ cardColor: "matte-black", quantity: -1 });
    expect(result.success).toBe(false);
  });
});

describe("nfcCardPostSchema", () => {
  it("accepts valid card", () => {
    const result = nfcCardPostSchema.safeParse({
      cardSlug: "my-card",
      cardName: "Business Card",
      destinationUrl: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug with spaces", () => {
    const result = nfcCardPostSchema.safeParse({
      cardSlug: "my card",
      cardName: "Test",
      destinationUrl: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = nfcCardPostSchema.safeParse({
      cardSlug: "my-card",
      cardName: "Test",
      destinationUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("nfcCardPatchSchema", () => {
  it("accepts whitelisted fields", () => {
    const result = nfcCardPatchSchema.safeParse({ id: "123", cardName: "Updated" });
    expect(result.success).toBe(true);
  });

  it("rejects extra fields (strict mode)", () => {
    const result = nfcCardPatchSchema.safeParse({ id: "123", userId: "hack" });
    expect(result.success).toBe(false);
  });
});

describe("whatsappCampaignPostSchema", () => {
  it("accepts valid campaign", () => {
    const result = whatsappCampaignPostSchema.safeParse({
      campaignName: "Sale",
      mediaUrl: "https://img.example.com/pic.jpg",
      scheduledAt: "2026-06-05T12:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-ISO datetime", () => {
    const result = whatsappCampaignPostSchema.safeParse({
      campaignName: "Sale",
      mediaUrl: "https://img.example.com/pic.jpg",
      scheduledAt: "tomorrow at 6pm",
    });
    expect(result.success).toBe(false);
  });
});

describe("competitorPostSchema", () => {
  it("accepts brand name only", () => {
    const result = competitorPostSchema.safeParse({ brandName: "Acme Corp" });
    expect(result.success).toBe(true);
  });

  it("rejects empty brand name", () => {
    const result = competitorPostSchema.safeParse({ brandName: "" });
    expect(result.success).toBe(false);
  });
});

describe("omnisocialConfigPutSchema", () => {
  it("accepts apiKey", () => {
    const result = omnisocialConfigPutSchema.safeParse({ apiKey: "sk-123" });
    expect(result.success).toBe(true);
  });

  it("accepts input", () => {
    const result = omnisocialConfigPutSchema.safeParse({ input: "https://mcp.example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects when both are missing", () => {
    const result = omnisocialConfigPutSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
