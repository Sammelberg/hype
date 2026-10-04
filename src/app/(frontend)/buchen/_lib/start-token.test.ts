import { describe, expect, it } from "vitest";

import { MIN_DAUER_MS, pruefeStart, signiereStart } from "./start-token";

const geheim = "x".repeat(32);

describe("pruefeStart", () => {
  const start = 1_800_000_000_000;

  it("accepts a start the server signed once a person could have filled the form", () => {
    expect(pruefeStart(signiereStart(start, geheim), start + MIN_DAUER_MS, geheim)).toBe("ok");
  });

  it("calls a form sent within seconds too fast", () => {
    expect(pruefeStart(signiereStart(start, geheim), start + 3_000, geheim)).toBe("zu-schnell");
  });

  it("refuses a forged, foreign, future or day-old start", () => {
    const echt = signiereStart(start, geheim);
    expect(pruefeStart(`${start - 60_000}.${echt.split(".")[1]}`, start, geheim)).toBe("ungueltig");
    expect(pruefeStart(signiereStart(start, "y".repeat(32)), start + 20_000, geheim)).toBe(
      "ungueltig",
    );
    expect(pruefeStart(echt, start - 1, geheim)).toBe("ungueltig");
    expect(pruefeStart(echt, start + 25 * 3_600_000, geheim)).toBe("ungueltig");
    expect(pruefeStart("kaputt", start, geheim)).toBe("ungueltig");
  });
});
