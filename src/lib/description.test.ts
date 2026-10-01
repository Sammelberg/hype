import { describe, expect, it } from "vitest";

import { clampDescription } from "./description";

describe("clampDescription", () => {
  it("leaves a short text as it is", () => {
    expect(clampDescription("Kurz und klar.")).toBe("Kurz und klar.");
  });

  it("ends a long text at the last sentence that fits", () => {
    const text = `${"a".repeat(100)}. ${"b".repeat(40)}. ${"c".repeat(80)}.`;
    expect(clampDescription(text)).toBe(`${"a".repeat(100)}. ${"b".repeat(40)}.`);
  });

  it("cuts at a word with an ellipsis when no sentence ends early enough", () => {
    const text = "Wort ".repeat(60).trim();
    const result = clampDescription(text) ?? "";
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result).toMatch(/Wort…$/);
  });

  it("collapses whitespace and returns undefined for nothing", () => {
    expect(clampDescription("  zwei \n Zeilen ")).toBe("zwei Zeilen");
    expect(clampDescription(null)).toBeUndefined();
    expect(clampDescription("   ")).toBeUndefined();
  });
});
