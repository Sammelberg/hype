import { describe, expect, it } from "vitest";

import { berechneFenster } from "./fenster";

const REGELN = { vorbereitungMin: 20, abbauMin: 15 };

describe("berechneFenster", () => {
  it("takes the performer from leaving home to being back: 90 min in Wiesbaden is about four hours", () => {
    const f = berechneFenster({
      beginn: new Date("2026-11-14T13:00:00.000Z"),
      fahrtMinuten: 60,
      dauerMin: 90,
      extrasDeltaMin: 0,
      ...REGELN,
    });
    expect(f.von.toISOString()).toBe("2026-11-14T11:40:00.000Z");
    expect(f.bis.toISOString()).toBe("2026-11-14T15:45:00.000Z");
  });

  it("lengthens the party, not the start, when an extra like face paint adds time", () => {
    const f = berechneFenster({
      beginn: new Date("2026-11-14T13:00:00.000Z"),
      fahrtMinuten: 0,
      dauerMin: 45,
      extrasDeltaMin: 20,
      ...REGELN,
    });
    expect(f.von.toISOString()).toBe("2026-11-14T12:40:00.000Z");
    expect(f.partyEnde.toISOString()).toBe("2026-11-14T14:05:00.000Z");
    expect(f.bis.toISOString()).toBe("2026-11-14T14:20:00.000Z");
  });

  it("counts real minutes across the night the clocks go back", () => {
    // 25 October 2026, 03:00 CEST becomes 02:00 CET: the hour repeats, the window must not shrink.
    const f = berechneFenster({
      beginn: new Date("2026-10-25T00:30:00.000Z"),
      fahrtMinuten: 30,
      dauerMin: 120,
      extrasDeltaMin: 0,
      ...REGELN,
    });
    expect(f.bis.getTime() - f.von.getTime()).toBe((30 + 20 + 120 + 15 + 30) * 60_000);
  });
});
