import { initials } from "./initials";

describe("initials", () => {
  it("takes first and last initial", () => {
    expect(initials("Anna Maria Beispiel")).toBe("AB");
  });
  it("uses one letter for a single word", () => {
    expect(initials("portfolio")).toBe("P");
  });
  it("handles umlauts and extra whitespace", () => {
    expect(initials("  özlem   ünal ")).toBe("ÖÜ");
  });
  it("falls back for an empty name", () => {
    expect(initials("", "X")).toBe("X");
  });
});
