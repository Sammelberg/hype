import { describe, expect, it } from "vitest";

import { openSecret, sealSecret } from "./secret";

const KEY = "an-app-secret-that-is-long-enough-12345";

describe("the mailbox password at rest", () => {
  it("comes back as it went in", () => {
    const sealed = sealSecret("abcd efgh ijkl mnop", KEY);
    expect(openSecret(sealed, KEY)).toBe("abcd efgh ijkl mnop");
  });

  it("is not readable in the stored form", () => {
    const sealed = sealSecret("Geheim-Passwort!", KEY);
    expect(sealed).not.toContain("Geheim");
    expect(sealed.startsWith("v1:")).toBe(true);
  });

  it("differs on every save, so equal passwords are not recognisable", () => {
    expect(sealSecret("gleich", KEY)).not.toBe(sealSecret("gleich", KEY));
  });

  it("cannot be opened with another server secret", () => {
    const sealed = sealSecret("Geheim", KEY);
    expect(openSecret(sealed, "another-app-secret-that-is-long-enough")).toBeNull();
  });

  it("refuses a changed stored value", () => {
    const sealed = sealSecret("Geheim", KEY);
    const last = sealed.at(-1) === "A" ? "B" : "A";
    expect(openSecret(sealed.slice(0, -1) + last, KEY)).toBeNull();
    expect(openSecret("kein gültiger Wert", KEY)).toBeNull();
  });
});
