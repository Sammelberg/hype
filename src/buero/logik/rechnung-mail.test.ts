import { describe, expect, it } from "vitest";

import { rechnungMail } from "./rechnung-mail";

describe("the covering e-mail of an invoice", () => {
  it("names number, amount and due date, addressed to a company", () => {
    const mail = rechnungMail({
      typ: "rechnung",
      nummer: "RE-2026-0007",
      brutto: 113050,
      faelligAm: "2026-10-15",
      empfaenger: { name: "Test Parkett GmbH", privat: false },
      absender: "Muster GmbH",
    });
    expect(mail.subject).toBe("Rechnung RE-2026-0007 – Muster GmbH");
    expect(mail.text.startsWith("Sehr geehrte Damen und Herren,\n")).toBe(true);
    // Intl puts a no-break space before the euro sign.
    expect(mail.text.replace(/\u00a0/g, " ")).toContain(
      "RE-2026-0007 über 1.130,50 €, zahlbar bis 15.10.2026.",
    );
    expect(mail.text.endsWith("Mit freundlichen Grüßen\nMuster GmbH")).toBe(true);
  });

  it("greets a private customer by name and names the cancelled invoice of a Storno", () => {
    const mail = rechnungMail({
      typ: "storno",
      nummer: "RE-2026-0008",
      brutto: -113050,
      faelligAm: null,
      korrigiertNummer: "RE-2026-0007",
      empfaenger: { name: "Erika Mustermann", privat: true },
      absender: "Muster GmbH",
    });
    expect(mail.subject).toBe("Stornorechnung RE-2026-0008 – Muster GmbH");
    expect(mail.text.startsWith("Guten Tag Erika Mustermann,\n")).toBe(true);
    expect(mail.text).toContain(
      "zur Rechnung RE-2026-0007. Sie hebt diese Rechnung vollständig auf.",
    );
    expect(mail.text).not.toContain("€");
  });
});
