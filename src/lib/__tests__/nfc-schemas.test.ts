import { describe, it, expect, vi, beforeEach } from "vitest";
import { nfcActivateSchema, nfcProfileUpsertSchema, validateBody } from "../validations/schemas";

describe("nfcActivateSchema", () => {
  it("accepts a valid activation code", () => {
    const result = nfcActivateSchema.safeParse({ activationCode: "AB12CD34" });
    expect(result.success).toBe(true);
  });

  it("rejects empty activation code", () => {
    const result = nfcActivateSchema.safeParse({ activationCode: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing activation code", () => {
    const result = nfcActivateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts lowercase code", () => {
    const result = nfcActivateSchema.safeParse({ activationCode: "ab12cd34" });
    expect(result.success).toBe(true);
  });

  it("accepts numeric-only code", () => {
    const result = nfcActivateSchema.safeParse({ activationCode: "12345678" });
    expect(result.success).toBe(true);
  });
});

describe("nfcProfileUpsertSchema", () => {
  const validProfile = {
    cardId: "card-uuid-123",
    displayName: "John Doe",
    bio: "Entrepreneur & creator",
    links: [
      { type: "instagram" as const, label: "Follow me", url: "https://instagram.com/john", linkOrder: 0 },
      { type: "email" as const, label: "Email me", url: "john@example.com", linkOrder: 1 },
    ],
  };

  it("accepts a valid profile with links", () => {
    const result = nfcProfileUpsertSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("John Doe");
      expect(result.data.links).toHaveLength(2);
    }
  });

  it("accepts a valid profile without optional fields", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-uuid-123",
      displayName: "Jane",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBeUndefined();
      expect(result.data.links).toEqual([]);
      expect(result.data.theme).toBe("default");
    }
  });

  it("rejects missing cardId", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      displayName: "John",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing displayName", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects displayName over 100 chars", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
      displayName: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects bio over 500 chars", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
      displayName: "John",
      bio: "B".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid link type", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
      displayName: "John",
      links: [{ type: "invalid_type", label: "Test", url: "https://test.com", linkOrder: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts all 14 valid link types", () => {
    const types = [
      "instagram", "whatsapp", "google_review", "phone", "email",
      "website", "maps", "shop", "booking", "youtube", "twitter",
      "linkedin", "facebook", "custom",
    ];
    const links = types.map((type, i) => ({
      type,
      label: `${type} link`,
      url: `https://example.com/${type}`,
      linkOrder: i,
    }));
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
      displayName: "John",
      links,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.links).toHaveLength(14);
    }
  });

  it("rejects link with missing label", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
      displayName: "John",
      links: [{ type: "website", url: "https://test.com", linkOrder: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects link with missing url", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
      displayName: "John",
      links: [{ type: "website", label: "My Site", linkOrder: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("defaults missing linkOrder to 0", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
      displayName: "John",
      links: [{ type: "website", label: "My Site", url: "https://test.com" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.links[0].linkOrder).toBe(0);
    }
  });

  it("rejects empty avatarUrl (non-url string)", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
      displayName: "John",
      avatarUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid avatarUrl", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
      displayName: "John",
      avatarUrl: "https://cdn.example.com/avatar.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for avatarUrl", () => {
    const result = nfcProfileUpsertSchema.safeParse({
      cardId: "card-123",
      displayName: "John",
      avatarUrl: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("validateBody helper", () => {
  it("returns data on valid input", () => {
    const result = validateBody(nfcActivateSchema, { activationCode: "AB12CD34" });
    if ("data" in result) {
      expect(result.data.activationCode).toBe("AB12CD34");
    } else {
      expect.fail("Expected data, got error");
    }
  });

  it("returns error string on invalid input", () => {
    const result = validateBody(nfcActivateSchema, {});
    expect("error" in result).toBe(true);
  });
});

describe("Payment webhook HMAC validation", () => {
  const { timingSafeEqual } = require("crypto");

  it("timingSafeEqual matches identical strings", () => {
    const a = Buffer.from("test-hash-123");
    const b = Buffer.from("test-hash-123");
    expect(timingSafeEqual(a, b)).toBe(true);
  });

  it("timingSafeEqual rejects different strings of same length", () => {
    const a = Buffer.from("test-hash-123");
    const b = Buffer.from("test-hash-456");
    expect(timingSafeEqual(a, b)).toBe(false);
  });

  it("timingSafeEqual rejects different length buffers", () => {
    const a = Buffer.from("test-hash-123");
    const b = Buffer.from("test-hash-12345");
    expect(() => timingSafeEqual(a, b)).toThrow();
  });
});
