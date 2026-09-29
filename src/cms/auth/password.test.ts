// @vitest-environment node
import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";
import { passwordProblem } from "./password-rules";

describe("passwords", () => {
  it("verifies the password it hashed and rejects others", async () => {
    const stored = await hashPassword("korrekt-batterie-pferd-heftklammer");
    expect(stored.startsWith("$argon2id$v=19$m=65536,t=3,p=1$")).toBe(true);
    expect(await verifyPassword("korrekt-batterie-pferd-heftklammer", stored)).toBe(true);
    expect(await verifyPassword("korrekt-batterie-pferd-heftklammer!", stored)).toBe(false);
  }, 20_000);

  it("answers false for a missing hash without throwing", async () => {
    expect(await verifyPassword("irgendwas", null)).toBe(false);
    expect(await verifyPassword("irgendwas", "kaputt")).toBe(false);
  }, 20_000);

  it("names what is wrong with a weak password", () => {
    expect(passwordProblem("kurz")).toBe("Mindestens 12 Zeichen.");
    expect(passwordProblem("            ")).toBe("Bitte ein echtes Passwort.");
    expect(passwordProblem("ein-langes-passwort")).toBeNull();
  });
});
