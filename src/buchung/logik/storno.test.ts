import { describe, expect, it } from "vitest";

import { stornoGebuehr } from "./storno";

const beginn = new Date("2026-12-12T13:00:00.000Z");
const STUNDE = 3_600_000;
const vorher = (stunden: number) => new Date(beginn.getTime() - stunden * STUNDE);
// Total 319.00 €, deposit 79.75 € paid.
const basis = { beginn, summeCent: 31900, bezahltCent: 7975 };

describe("stornoGebuehr", () => {
  it("refunds the deposit and frees the slot by itself more than 14 days ahead", () => {
    expect(stornoGebuehr({ ...basis, jetzt: vorher(20 * 24), durch: "kunde" })).toEqual({
      gebuehrCent: 0,
      erstattungCent: 7975,
      nachforderungCent: 0,
      slotFrei: true,
      entscheidung: "auto",
    });
  });

  it("keeps the deposit and frees the slot from 14 down to 7 days ahead", () => {
    for (const stunden of [14 * 24, 10 * 24, 7 * 24]) {
      expect(stornoGebuehr({ ...basis, jetzt: vorher(stunden), durch: "kunde" })).toEqual({
        gebuehrCent: 7975,
        erstattungCent: 0,
        nachforderungCent: 0,
        slotFrei: true,
        entscheidung: "auto",
      });
    }
  });

  it("charges half and leaves it to the owner between 7 days and 48 hours", () => {
    expect(stornoGebuehr({ ...basis, jetzt: vorher(48), durch: "kunde" })).toEqual({
      gebuehrCent: 15950,
      erstattungCent: 0,
      nachforderungCent: 7975,
      slotFrei: false,
      entscheidung: "admin",
    });
  });

  it("charges everything and leaves it to the owner under 48 hours", () => {
    expect(stornoGebuehr({ ...basis, jetzt: vorher(47), durch: "kunde" })).toEqual({
      gebuehrCent: 31900,
      erstattungCent: 0,
      nachforderungCent: 23925,
      slotFrei: false,
      entscheidung: "admin",
    });
  });

  it("refunds everything paid when the agency cancels, however late", () => {
    expect(stornoGebuehr({ ...basis, jetzt: vorher(2), durch: "agentur" })).toEqual({
      gebuehrCent: 0,
      erstattungCent: 7975,
      nachforderungCent: 0,
      slotFrei: true,
      entscheidung: "auto",
    });
  });
});
