// @vitest-environment node
import { describe, expect, it } from "vitest";

import { signStart, TOKEN_MAX_AGE_MS, verifyStart } from "./form-token";

const secret = "test-geheimnis-mit-genug-laenge-0123456789";
const now = 1_790_000_000_000;

describe("form token", () => {
  it("gives back the time it was signed with", () => {
    expect(verifyStart(signStart(now - 5000, secret), now, secret)).toBe(now - 5000);
  });

  it("refuses a time the server did not sign", () => {
    const [, signature] = signStart(now - 5000, secret).split(".");
    expect(verifyStart(`${now - 60_000}.${signature}`, now, secret)).toBeNull();
    expect(verifyStart(String(now - 60_000), now, secret)).toBeNull();
    expect(
      verifyStart(signStart(now - 5000, "anderes-geheimnis-0123456789abcdef"), now, secret),
    ).toBeNull();
    expect(verifyStart("", now, secret)).toBeNull();
    expect(verifyStart("abc.def", now, secret)).toBeNull();
  });

  it("refuses one from the future or older than a day", () => {
    expect(verifyStart(signStart(now + 1000, secret), now, secret)).toBeNull();
    expect(verifyStart(signStart(now - TOKEN_MAX_AGE_MS - 1, secret), now, secret)).toBeNull();
  });
});
