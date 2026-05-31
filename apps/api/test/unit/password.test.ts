import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../src/auth/password.js";

describe("password hashing", () => {
  it("hashes to something other than the plaintext", async () => {
    const hash = await hashPassword("s3cretpw!");
    expect(hash).not.toBe("s3cretpw!");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("s3cretpw!");
    expect(await verifyPassword("s3cretpw!", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cretpw!");
    expect(await verifyPassword("wrong-guess", hash)).toBe(false);
  });
});
