import { describe, expect, it } from "vitest";

import {
  MAHNSTUFEN,
  mahnungVorschlag,
  naechsteMahnstufe,
  offenerBetrag,
  verzugsbeginn,
  verzugszinsen,
  zahlungsstand,
} from "./forderung";

describe("offenerBetrag / zahlungsstand", () => {
  it("subtracts every payment from the gross total", () => {
    expect(offenerBetrag(119000, [50000, 19000])).toBe(50000);
  });

  it("reads paid in full only once nothing is left", () => {
    expect(zahlungsstand(119000, [50000])).toBe("teilbezahlt");
    expect(zahlungsstand(119000, [119000])).toBe("bezahlt");
    expect(zahlungsstand(119000, [])).toBe("offen");
  });

  it("counts an overpayment as paid, and keeps the surplus visible as a negative rest", () => {
    expect(zahlungsstand(119000, [120000])).toBe("bezahlt");
    expect(offenerBetrag(119000, [120000])).toBe(-1000);
  });
});

describe("verzugszinsen (§288 BGB)", () => {
  it("is base rate plus nine points between businesses, per day of a 365-day year", () => {
    // 10,000.00 € × (1.27 + 9) % × 30 / 365 = 84.41 €
    expect(verzugszinsen({ betrag: 1_000_000, basiszins: 1.27, privat: false, tage: 30 })).toEqual({
      satz: 10.27,
      cent: 8441,
    });
  });

  it("is base rate plus five points for a consumer", () => {
    // 1,000.00 € × 6.27 % × 73 / 365 = 12.54 €
    expect(verzugszinsen({ betrag: 100_000, basiszins: 1.27, privat: true, tage: 73 })).toEqual({
      satz: 6.27,
      cent: 1254,
    });
  });

  it("works with a negative base rate and never charges for no days", () => {
    expect(verzugszinsen({ betrag: 100_000, basiszins: -0.88, privat: true, tage: 365 }).satz).toBe(
      4.12,
    );
    expect(verzugszinsen({ betrag: 100_000, basiszins: 1.27, privat: false, tage: 0 }).cent).toBe(
      0,
    );
  });
});

describe("verzugsbeginn (§286 BGB)", () => {
  const rechnung = { ausgestelltAm: "2026-03-02", faelligAm: "2026-03-16" };

  it("starts for a business 30 days after the invoice at the latest", () => {
    expect(verzugsbeginn({ ...rechnung, privat: false, ersteMahnung: null })).toBe("2026-04-02");
  });

  it("starts with the first reminder that is a Mahnung, if that comes earlier", () => {
    expect(verzugsbeginn({ ...rechnung, privat: false, ersteMahnung: "2026-03-20" })).toBe(
      "2026-03-21",
    );
  });

  it("needs a Mahnung for a consumer", () => {
    expect(verzugsbeginn({ ...rechnung, privat: true, ersteMahnung: null })).toBeNull();
    expect(verzugsbeginn({ ...rechnung, privat: true, ersteMahnung: "2026-04-10" })).toBe(
      "2026-04-11",
    );
  });

  it("never starts before the due date has passed", () => {
    expect(
      verzugsbeginn({
        ausgestelltAm: "2026-03-02",
        faelligAm: "2026-05-01",
        privat: false,
        ersteMahnung: "2026-03-10",
      }),
    ).toBe("2026-05-02");
  });
});

describe("Mahnstufen", () => {
  it("goes reminder → first → second (last) Mahnung, then stops", () => {
    expect(MAHNSTUFEN.map((s) => s.titel)).toEqual([
      "Zahlungserinnerung",
      "1. Mahnung",
      "2. Mahnung",
    ]);
    expect(naechsteMahnstufe([])).toBe(0);
    expect(naechsteMahnstufe([0])).toBe(1);
    expect(naechsteMahnstufe([0, 1])).toBe(2);
    expect(naechsteMahnstufe([0, 1, 2])).toBeNull();
  });
});

describe("mahnungVorschlag", () => {
  const basis = {
    brutto: 119_000,
    zahlungen: [],
    ausgestelltAm: "2026-03-02",
    faelligAm: "2026-03-16",
    basiszins: 1.27,
    frueher: [] as { stufe: number; am: string; pauschale: number }[],
  };

  it("asks only for the open amount in a friendly reminder, with a new deadline", () => {
    const v = mahnungVorschlag({ ...basis, privat: false, am: "2026-03-23" });
    expect(v).toMatchObject({
      stufe: 0,
      offen: 119_000,
      zinsen: 0,
      pauschale: 0,
      gebuehr: 0,
      neueFrist: "2026-03-30",
    });
    expect(v.gesamt).toBe(119_000);
  });

  it("adds interest from the start of default and the 40 € flat fee once, between businesses", () => {
    const v = mahnungVorschlag({
      ...basis,
      privat: false,
      am: "2026-05-02",
      frueher: [{ stufe: 0, am: "2026-03-23", pauschale: 0 }],
    });
    // Default from 2.4. (30 days after the invoice): 2.4.–2.5. are 30 days.
    expect(v.stufe).toBe(1);
    expect(v.verzugSeit).toBe("2026-04-02");
    expect(v.tage).toBe(30);
    expect(v.zinsen).toBe(
      verzugszinsen({ betrag: 119_000, basiszins: 1.27, privat: false, tage: 30 }).cent,
    );
    expect(v.pauschale).toBe(4000);
    expect(v.gesamt).toBe(119_000 + v.zinsen + 4000);
  });

  it("does not charge the flat fee twice", () => {
    const v = mahnungVorschlag({
      ...basis,
      privat: false,
      am: "2026-05-20",
      frueher: [
        { stufe: 0, am: "2026-03-23", pauschale: 0 },
        { stufe: 1, am: "2026-05-02", pauschale: 4000 },
      ],
    });
    expect(v.stufe).toBe(2);
    expect(v.pauschale).toBe(0);
  });

  it("charges a consumer interest only after the first Mahnung, and no flat fee", () => {
    const erste = mahnungVorschlag({
      ...basis,
      privat: true,
      am: "2026-04-10",
      frueher: [{ stufe: 0, am: "2026-03-23", pauschale: 0 }],
    });
    expect(erste).toMatchObject({ stufe: 1, zinsen: 0, pauschale: 0, verzugSeit: null });
    const zweite = mahnungVorschlag({
      ...basis,
      privat: true,
      am: "2026-04-30",
      frueher: [
        { stufe: 0, am: "2026-03-23", pauschale: 0 },
        { stufe: 1, am: "2026-04-10", pauschale: 0 },
      ],
    });
    expect(zweite.verzugSeit).toBe("2026-04-11");
    expect(zweite.tage).toBe(19);
    expect(zweite.zinsen).toBeGreaterThan(0);
    expect(zweite.pauschale).toBe(0);
  });

  it("charges interest on what is still open after part payments", () => {
    const v = mahnungVorschlag({
      ...basis,
      zahlungen: [100_000],
      privat: false,
      am: "2026-05-02",
      frueher: [{ stufe: 0, am: "2026-03-23", pauschale: 0 }],
    });
    expect(v.offen).toBe(19_000);
    expect(v.zinsen).toBe(
      verzugszinsen({ betrag: 19_000, basiszins: 1.27, privat: false, tage: 30 }).cent,
    );
  });
});
