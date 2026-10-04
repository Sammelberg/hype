import { describe, expect, it } from "vitest";

import { safePreviewPath } from "./safe-path";

const origin = "https://kern.example";

describe("safePreviewPath", () => {
  it.each([
    ["/", "/"],
    ["/ueber-uns", "/ueber-uns"],
    ["/projekte/krone?x=1", "/projekte/krone?x=1"],
    ["/%5Cevil.com", "/%5Cevil.com"],
  ])("keeps a path on this site: %s", (path, expected) => {
    expect(safePreviewPath(path, origin)).toBe(expected);
  });

  it.each([
    "/\\evil.com",
    "//evil.com",
    "https://evil.com",
    "evil.com",
    "/\tevil.com",
    "\\\\evil.com",
    "",
  ])("refuses anything that could leave it: %s", (path) => {
    expect(safePreviewPath(path, origin)).toBeNull();
  });
});
