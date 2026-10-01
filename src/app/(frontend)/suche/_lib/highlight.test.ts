import { describe, expect, it } from "vitest";

import { highlight } from "./highlight";

const hits = (text: string, query: string) =>
  highlight(text, query)
    .filter((p) => p.hit)
    .map((p) => p.text);

describe("highlight", () => {
  it("marks every occurrence of every word, whatever its case", () => {
    expect(hits("Web-Anwendungen und mobile Anwendungen", "anwendungen")).toEqual([
      "Anwendungen",
      "Anwendungen",
    ]);
    expect(hits("Daten in Europa", "europa daten")).toEqual(["Daten", "Europa"]);
  });

  it("keeps the whole text in order", () => {
    const text = "Schnittstellen und Integration";
    expect(
      highlight(text, "und")
        .map((p) => p.text)
        .join(""),
    ).toBe(text);
  });

  it("marks inside a word and with umlauts", () => {
    expect(hits("Größere Abläufe", "abläufe")).toEqual(["Abläufe"]);
    expect(hits("Werkzeug-Inventar", "zeug")).toEqual(["zeug"]);
  });

  it("marks nothing for one letter or special characters taken literally", () => {
    expect(hits("a b c", "a")).toEqual([]);
    expect(hits("Preis (netto)", "(netto)")).toEqual(["(netto)"]);
  });
});
