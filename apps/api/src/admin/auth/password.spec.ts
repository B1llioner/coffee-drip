import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("admin password hashing", () => {
  it("verifies the password without storing it in plaintext", async () => {
    const encoded = await hashPassword("AlgiAdmin-Dev-2026!");
    expect(encoded).not.toContain("AlgiAdmin-Dev-2026!");
    expect(await verifyPassword("AlgiAdmin-Dev-2026!", encoded)).toBe(true);
    expect(await verifyPassword("wrong-password", encoded)).toBe(false);
  });
});
