import { describe, expect, it } from "vitest";

import { filterAusParams, filtereFiguren, filterLink } from "./katalog";

const figuren = [
  {
    slug: "eis",
    kategorie: "prinzessinnen" as const,
    alterVon: 3,
    alterBis: 8,
    sprachen: ["de", "uk"] as ("de" | "uk" | "ru" | "en")[],
  },
  {
    slug: "held",
    kategorie: "superhelden" as const,
    alterVon: 6,
    alterBis: 10,
    sprachen: ["de", "en"] as ("de" | "uk" | "ru" | "en")[],
  },
  {
    slug: "dino",
    kategorie: "tiere" as const,
    alterVon: 9,
    alterBis: 12,
    sprachen: ["de"] as ("de" | "uk" | "ru" | "en")[],
  },
];
const slugs = (f: { slug: string }[]) => f.map((x) => x.slug);

describe("filtereFiguren", () => {
  it("keeps every character when nothing is chosen", () => {
    expect(slugs(filtereFiguren(figuren, {}))).toEqual(["eis", "held", "dino"]);
  });

  it("keeps characters whose ages overlap the chosen range", () => {
    expect(slugs(filtereFiguren(figuren, { alter: "5-8" }))).toEqual(["eis", "held"]);
    expect(slugs(filtereFiguren(figuren, { alter: "8-12" }))).toEqual(["eis", "held", "dino"]);
  });

  it("filters by category and by the host's language together", () => {
    expect(slugs(filtereFiguren(figuren, { kategorie: "superhelden", sprache: "en" }))).toEqual([
      "held",
    ]);
    expect(slugs(filtereFiguren(figuren, { sprache: "uk" }))).toEqual(["eis"]);
  });
});

describe("filterAusParams", () => {
  it("reads only known values from the address and drops the rest", () => {
    expect(filterAusParams({ kategorie: "tiere", alter: "5-8", sprache: "ru" })).toEqual({
      kategorie: "tiere",
      alter: "5-8",
      sprache: "ru",
    });
    expect(
      filterAusParams({ kategorie: "<script>", alter: "1-99", sprache: ["de", "uk"] }),
    ).toEqual({});
  });
});

describe("filterLink", () => {
  it("sets or clears one filter and keeps the others, in a fixed order", () => {
    expect(filterLink({ sprache: "uk" }, { alter: "5-8" })).toBe("/figuren?alter=5-8&sprache=uk");
    expect(filterLink({ alter: "5-8", sprache: "uk" }, { alter: undefined })).toBe(
      "/figuren?sprache=uk",
    );
    expect(filterLink({ kategorie: "tiere" }, { kategorie: undefined })).toBe("/figuren");
  });
});
