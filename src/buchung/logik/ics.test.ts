import { describe, expect, it } from "vitest";

import { icsTermin } from "./ics";

const termin = (mehr: Partial<Parameters<typeof icsTermin>[0]> = {}) =>
  icsTermin({
    uid: "BU-2026-0042@hype-agency.de",
    beginn: new Date("2026-10-25T14:00:00.000Z"),
    ende: new Date("2026-10-25T15:30:00.000Z"),
    titel: "Kindergeburtstag mit der Eisprinzessin",
    ort: "Musterstraße 1, 63739 Aschaffenburg",
    beschreibung: "Paket Klassik",
    jetzt: new Date("2026-10-04T10:00:00.000Z"),
    ...mehr,
  });

describe("icsTermin", () => {
  it("writes the times in UTC, so a calendar shows 15:00 on the day the clocks go back", () => {
    const ics = termin();
    expect(ics).toContain("DTSTART:20261025T140000Z\r\n");
    expect(ics).toContain("DTEND:20261025T153000Z\r\n");
    expect(ics).toContain("DTSTAMP:20261004T100000Z\r\n");
    expect(ics).toContain("UID:BU-2026-0042@hype-agency.de\r\n");
  });

  it("is one VEVENT inside a VCALENDAR, every line ending in CRLF", () => {
    const zeilen = termin().split("\r\n");
    expect(zeilen[0]).toBe("BEGIN:VCALENDAR");
    expect(zeilen).toContain("BEGIN:VEVENT");
    expect(zeilen).toContain("END:VEVENT");
    expect(zeilen.at(-2)).toBe("END:VCALENDAR");
    expect(zeilen.at(-1)).toBe("");
  });

  it("escapes commas, semicolons, backslashes and line breaks in text", () => {
    // Unfolded, as a calendar reads it.
    const ics = termin({
      beschreibung: "Paket Klassik; Extras: Schminken, Ballons\nHund im Hof \\ Code",
    }).replace(/\r\n /g, "");
    expect(ics).toContain(
      "DESCRIPTION:Paket Klassik\\; Extras: Schminken\\, Ballons\\nHund im Hof \\\\ Code\r\n",
    );
    expect(ics).toContain("LOCATION:Musterstraße 1\\, 63739 Aschaffenburg\r\n");
  });

  it("folds long lines at 75 bytes without cutting an umlaut in half", () => {
    const lang = "Größe ".repeat(30);
    const zeilen = termin({ beschreibung: lang }).split("\r\n");
    const start = zeilen.findIndex((z) => z.startsWith("DESCRIPTION:"));
    const teile = [zeilen[start]!];
    for (let i = start + 1; zeilen[i]!.startsWith(" "); i++) teile.push(zeilen[i]!);
    expect(teile.length).toBeGreaterThan(1);
    for (const t of teile) expect(new TextEncoder().encode(t).length).toBeLessThanOrEqual(75);
    expect(teile.map((t, i) => (i === 0 ? t : t.slice(1))).join("")).toBe(`DESCRIPTION:${lang}`);
  });
});
