import { describe, it, expect } from "vitest";
import {
  generateNickname,
  isValidUsername,
  normalizeUsername,
} from "../../src/auth/nickname.js";

describe("username helpers", () => {
  it("accepts valid handles and rejects invalid ones", () => {
    expect(isValidUsername("pasha")).toBe(true);
    expect(isValidUsername("a_b_12")).toBe(true);
    expect(isValidUsername("ab")).toBe(false); // too short
    expect(isValidUsername("x".repeat(21))).toBe(false); // too long
    expect(isValidUsername("Pasha")).toBe(false); // uppercase
    expect(isValidUsername("has space")).toBe(false);
    expect(isValidUsername("dash-no")).toBe(false);
  });

  it("normalizes to lowercase + trimmed", () => {
    expect(normalizeUsername("  Pasha ")).toBe("pasha");
  });

  it("always generates a valid handle", () => {
    for (let i = 0; i < 100; i++) {
      expect(isValidUsername(generateNickname())).toBe(true);
    }
  });
});
