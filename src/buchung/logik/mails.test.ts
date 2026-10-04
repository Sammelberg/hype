import { describe, expect, it } from "vitest";

import {
  anfrageMail,
  bestaetigungMail,
  hinweisMail,
  stornoMail,
  vortagMail,
  type MailBuchung,
} from "./mails";

const b: MailBuchung = {
  nummer: "BU-2026-0007",
  status: "bestaetigt",
  figuren: ["Eisprinzessin"],
  paket: "Klassik",
  beginn: new Date("2026-11-21T13:00:00.000Z"),
  adresse: "Hauptstraße 1, 63739 Aschaffenburg",
  kontaktName: "Anna Muster",
  kindName: "Mia",
  rechnungAn: null,
  positionen: [
    { art: "paket", bezeichnung: "Klassik", cent: 24900 },
    { art: "zone", bezeichnung: "Anfahrt Aschaffenburg (Zone A)", cent: 0 },
    { art: "extra", bezeichnung: "Kinderschminken", cent: 3000 },
  ],
  summeCent: 27900,
  anzahlungCent: 6975,
  link: "https://hype.example/buchung/abc",
};

describe("booking mails", () => {
  it("confirms with the German date and time, the lines of the price and the link", () => {
    const m = bestaetigungMail(b, "Hype Agency");
    expect(m.subject).toBe("Gebucht: Eisprinzessin am 21. November, 14:00 Uhr");
    expect(m.text).toContain("Termin: Samstag, 21. November, 14:00 Uhr");
    expect(m.text).toContain("Anfahrt Aschaffenburg (Zone A): inklusive");
    expect(m.text).toContain("Anzahlung bezahlt: 69,75 €");
    expect(m.text).toContain("Noch offen: 209,25 €");
    expect(m.text).toContain("https://hype.example/buchung/abc");
    expect(m.text.startsWith("Guten Tag Anna Muster,")).toBe(true);
  });

  it("leaves the link out when it cannot be sent and says when the total is still open", () => {
    const m = anfrageMail({ ...b, status: "anfrage", link: null, summeCent: null }, "Hype Agency");
    expect(m.text).toContain("Wunschtermin: Samstag, 21. November, 14:00 Uhr");
    expect(m.text).toContain("Den Gesamtpreis nennen wir Ihnen mit dem Angebot.");
    expect(m.text).not.toContain("https://");
  });

  it("says what a cancellation costs or what comes back", () => {
    expect(stornoMail(b, "H", { gebuehrCent: 0, erstattungCent: 6975 }).text).toContain(
      "Sie bekommen 69,75 € zurück",
    );
    expect(stornoMail(b, "H", { gebuehrCent: 13950, erstattungCent: 0 }).text).toContain(
      "fallen 139,50 € an",
    );
  });

  it("reminds the day before with the hour the Figur rings", () => {
    expect(vortagMail(b, "H").text).toContain("klingelt pünktlich um 14:00 Uhr");
  });

  it("notes a new booking for the owner with the way into the admin", () => {
    const m = hinweisMail(b, "Neue Buchung", "https://hype.example/admin/buchung/buchungen/7");
    expect(m.subject).toBe("Neue Buchung: BU-2026-0007, 21. November, 14:00 Uhr");
    expect(m.text).toContain("In der Verwaltung: https://hype.example/admin/buchung/buchungen/7");
  });
});
