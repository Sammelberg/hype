import { describe, expect, it } from "vitest";

import { nurAnfrage, sichtbareExtras, tageBis } from "./regeln";

const jetzt = new Date("2026-11-10T09:00:00.000Z");
const STUNDE = 3_600_000;
const zoneA = { nurAnfrage: false };
const paket = { nurAnfrage: false };

const grund = (beginn: Date, mehr: Partial<Parameters<typeof nurAnfrage>[0]> = {}) =>
  nurAnfrage({
    beginn,
    jetzt,
    mindestVorlaufStd: 48,
    zone: zoneA,
    paket,
    extras: [],
    ...mehr,
  });

describe("nurAnfrage", () => {
  it("lets a booking confirm itself from exactly 48 hours ahead", () => {
    expect(grund(new Date(jetzt.getTime() + 48 * STUNDE))).toBeNull();
  });

  it("makes anything sooner than 48 hours a request", () => {
    expect(grund(new Date(jetzt.getTime() + 48 * STUNDE - 60_000))).toBe("kurzfristig");
  });

  it("makes zone E, a town outside the zones, an on-request package or extra a request", () => {
    const spaeter = new Date(jetzt.getTime() + 14 * 24 * STUNDE);
    expect(grund(spaeter, { zone: { nurAnfrage: true } })).toBe("zone");
    expect(grund(spaeter, { zone: null })).toBe("ausserhalb");
    expect(grund(spaeter, { paket: { nurAnfrage: true } })).toBe("paket");
    expect(grund(spaeter, { extras: [{ nurAnfrage: false }, { nurAnfrage: true }] })).toBe("extra");
  });
});

describe("tageBis", () => {
  it("counts German calendar days, so late evening still belongs to its own day", () => {
    // 23:30 in Germany on 10 November is still the 10th; the party is on the 13th.
    expect(
      tageBis(new Date("2026-11-10T22:30:00.000Z"), new Date("2026-11-13T13:00:00.000Z")),
    ).toBe(3);
  });
});

describe("sichtbareExtras", () => {
  const kerze = { slug: "kerze", vorlaufTage: 7 };
  const blumen = { slug: "blumen", vorlaufTage: 5 };
  const ballons = { slug: "ballons", vorlaufTage: 0 };
  const alle = [kerze, blumen, ballons];
  const tag = (n: number) => new Date(jetzt.getTime() + n * 24 * STUNDE);

  it("hides the candle arrangement three days ahead, shows what can still be made", () => {
    expect(sichtbareExtras(alle, tag(3), jetzt).map((e) => e.slug)).toEqual(["ballons"]);
  });

  it("offers the candle arrangement from seven days ahead", () => {
    expect(sichtbareExtras(alle, tag(7), jetzt).map((e) => e.slug)).toEqual([
      "kerze",
      "blumen",
      "ballons",
    ]);
  });
});
