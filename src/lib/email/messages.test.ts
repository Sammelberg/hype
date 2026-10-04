import { describe, expect, it } from "vitest";

import { anfrageMail, passwordResetMail, testMail } from "./messages";

describe("the site's own e-mails", () => {
  it("signs the test mail with the sender's name", () => {
    const mail = testMail("Muster GmbH");
    expect(mail.subject).toBe("Test: E-Mail-Versand – Muster GmbH");
    expect(mail.text).toMatch(/richtig eingerichtet/);
    expect(mail.text.endsWith("Muster GmbH")).toBe(true);
  });

  it("gives the reset link on a line of its own with its lifetime", () => {
    const url = "https://example.de/admin/passwort-vergessen/abc";
    const mail = passwordResetMail({ url, siteName: "Muster GmbH", minutes: 60 });
    expect(mail.subject).toBe("Passwort zurücksetzen – Muster GmbH");
    expect(mail.text.split("\n")).toContain(url);
    expect(mail.text).toMatch(/gilt 60 Minuten und nur einmal/);
  });

  it("lists a contact message's fields, long text as a block, empty ones left out", () => {
    const mail = anfrageMail({
      siteName: "Muster GmbH",
      formTitle: "Kontakt",
      fields: [
        { label: "Name", value: "Erika Mustermann" },
        { label: "Telefon", value: " " },
        { label: "Nachricht", value: "Zeile eins\nZeile zwei" },
      ],
      url: "https://example.de/admin/anfragen/7",
    });
    expect(mail.subject).toBe("Neue Nachricht über „Kontakt“ – Muster GmbH");
    expect(mail.text).toContain("Name: Erika Mustermann");
    expect(mail.text).not.toContain("Telefon");
    expect(mail.text).toContain("Nachricht:\nZeile eins\nZeile zwei");
    expect(
      mail.text.trim().endsWith("In der Verwaltung: https://example.de/admin/anfragen/7"),
    ).toBe(true);
  });
});
