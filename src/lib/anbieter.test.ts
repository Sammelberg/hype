import { describe, expect, it } from "vitest";

import { anbieterJsonLd, type AnbieterDaten } from "./anbieter";

const basis: AnbieterDaten = {
  name: "Hype Agency",
  url: "https://hype.example/",
  description: "Kinderanimation mit Figuren",
  firma: null,
  staedte: ["Aschaffenburg", "Hanau"],
  preise: { vonCent: 14900, bisCent: 34900 },
  sprachen: ["de", "uk", "ru"],
};

describe("anbieterJsonLd", () => {
  it("stays an Organization with the towns it serves while the address is missing", () => {
    const d = anbieterJsonLd(basis);
    expect(d["@type"]).toBe("Organization");
    expect(d.address).toBeUndefined();
    expect(d.priceRange).toBeUndefined();
    expect(d.areaServed).toEqual([
      { "@type": "City", name: "Aschaffenburg" },
      { "@type": "City", name: "Hanau" },
    ]);
  });

  it("becomes a local business with address, phone and price range once they are entered", () => {
    const d = anbieterJsonLd({
      ...basis,
      firma: { strasse: "Hauptstraße 1", plz: "63739", ort: "Aschaffenburg", telefon: "06021 1" },
    });
    expect(d["@type"]).toBe("EntertainmentBusiness");
    expect(d.address).toMatchObject({ postalCode: "63739", addressCountry: "DE" });
    expect(d.telephone).toBe("06021 1");
    expect(d.priceRange).toBe("149 €–349 €");
  });
});
