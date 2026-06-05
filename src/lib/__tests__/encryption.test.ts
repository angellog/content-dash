import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt } from "../encryption";

describe("encryption", () => {
  beforeAll(() => {
    process.env.OMNISOCIAL_ENCRYPTION_KEY = "test-key-at-least-16-chars";
    process.env.ENCRYPTION_SALT = "test-salt";
  });

  it("should encrypt and decrypt a string roundtrip", () => {
    const plaintext = "my-secret-api-key-12345";
    const ciphertext = encrypt(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("should produce different ciphertexts for same plaintext (random IV)", () => {
    const plaintext = "same-input";
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);
    expect(c1).not.toBe(c2);
    expect(decrypt(c1)).toBe(plaintext);
    expect(decrypt(c2)).toBe(plaintext);
  });

  it("should handle empty string", () => {
    const ciphertext = encrypt("");
    expect(decrypt(ciphertext)).toBe("");
  });

  it("should handle unicode characters", () => {
    const plaintext = "日本語テスト 🎉 ñ é ü";
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("should throw on invalid ciphertext", () => {
    expect(() => decrypt("not-valid-base64url!")).toThrow();
  });

  it("should throw on tampered ciphertext", () => {
    const ciphertext = encrypt("sensitive-data");
    const tampered = ciphertext.slice(0, -4) + "XXXX";
    expect(() => decrypt(tampered)).toThrow();
  });

  it("should throw when OMNISOCIAL_ENCRYPTION_KEY is too short", () => {
    delete process.env.OMNISOCIAL_ENCRYPTION_KEY;
    expect(() => encrypt("test")).toThrow("OMNISOCIAL_ENCRYPTION_KEY");
    process.env.OMNISOCIAL_ENCRYPTION_KEY = "test-key-at-least-16-chars";
  });
});
