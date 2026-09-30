import { describe, expect, it } from "vitest";

import { passwordProblem } from "./password-rules";
import { TEMPORARY_PASSWORD_BITS, temporaryPassword } from "./temporary-password";

describe("temporaryPassword", () => {
  it("carries at least 80 bits", () => {
    expect(TEMPORARY_PASSWORD_BITS).toBeGreaterThanOrEqual(80);
  });

  it("reads aloud in groups of four, without look-alikes", () => {
    const password = temporaryPassword();
    expect(password).toMatch(/^[a-z2-9]{4}(-[a-z2-9]{4}){4}$/);
    expect(password).not.toMatch(/[lo01]/);
  });

  it("passes the password rules", () => {
    expect(passwordProblem(temporaryPassword())).toBeNull();
  });

  it("differs every time", () => {
    const seen = new Set(Array.from({ length: 200 }, temporaryPassword));
    expect(seen.size).toBe(200);
  });
});
