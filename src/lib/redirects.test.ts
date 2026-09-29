import { normalizePath } from "./redirects";

describe("normalizePath", () => {
  it.each([
    ["/alt/pfad", "/alt/pfad"],
    ["alt/pfad/", "/alt/pfad"],
    ["https://example.com/alt?x=1#y", "/alt"],
    ["/Leistungen/Beratung", "/leistungen/beratung"],
    ["/", "/"],
    ["", "/"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});
