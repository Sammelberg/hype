import { describe, expect, it } from "vitest";

import { KundeSchema } from "./typen";

const kunde = (land: string, plz: string | null) => ({
  art: "privat" as const,
  firma: null,
  name: "Test Kunde",
  email: null,
  telefon: null,
  strasse: null,
  plz,
  ort: null,
  land,
  ustId: null,
  leitwegId: null,
  zahlungszielTage: null,
  ansprechpartner: [],
  notizen: null,
});

const fehler = (land: string, plz: string | null) => {
  const ergebnis = KundeSchema.safeParse(kunde(land, plz));
  return ergebnis.success
    ? null
    : (ergebnis.error.issues.find((i) => i.path[0] === "plz")?.message ?? null);
};

describe("KundeSchema postcode", () => {
  it("takes the postcode of the customer's country", () => {
    expect(fehler("DE", "79379")).toBeNull();
    expect(fehler("CH", "4051")).toBeNull();
    expect(fehler("AT", "6020")).toBeNull();
    expect(fehler("LI", "9490")).toBeNull();
    expect(fehler("FR", "68100")).toBeNull();
    expect(fehler("GB", "SW1A 1AA")).toBeNull();
    expect(fehler("DE", null)).toBeNull();
  });

  it("refuses a postcode that does not fit the country", () => {
    expect(fehler("DE", "4051")).toBe("Eine Postleitzahl in DE hat fünf Ziffern.");
    expect(fehler("CH", "79379")).toBe("Eine Postleitzahl in CH hat vier Ziffern.");
    expect(fehler("GB", "SW1A/1AA")).toBe("Nur Buchstaben, Ziffern, Leerzeichen und Bindestriche.");
  });
});
