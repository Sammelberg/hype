import { describe, expect, it } from "vitest";

import { smtpErrorMessage } from "./errors";

const error = (fields: Record<string, unknown>) =>
  Object.assign(new Error(String(fields.message ?? "SMTP")), fields);

describe("what the owner reads when sending fails", () => {
  it("points Gmail users to the app password on a refused login", () => {
    expect(
      smtpErrorMessage(error({ code: "EAUTH", responseCode: 535 }), { host: "smtp.gmail.com" }),
    ).toBe(
      "Anmeldung abgelehnt: Bitte Adresse und Passwort prüfen. Gmail verlangt ein App-Passwort, nicht Ihr normales Google-Passwort.",
    );
    expect(smtpErrorMessage(error({ code: "EAUTH" }), { provider: "ionos" })).toBe(
      "Anmeldung abgelehnt: Bitte Adresse und Passwort prüfen.",
    );
  });

  it("names the server it could not reach", () => {
    for (const code of ["ECONNECTION", "ESOCKET", "EDNS", "ENOTFOUND", "ECONNREFUSED"]) {
      expect(smtpErrorMessage(error({ code }), { host: "smtp.beispiel.de" }), code).toBe(
        "Keine Verbindung zu smtp.beispiel.de: Bitte Server und Port prüfen.",
      );
    }
  });

  it("tells a slow server apart", () => {
    expect(smtpErrorMessage(error({ code: "ETIMEDOUT" }), { host: "smtp.beispiel.de" })).toBe(
      "smtp.beispiel.de antwortet nicht. Bitte später erneut versuchen oder Server und Port prüfen.",
    );
  });

  it("explains a failed encryption handshake", () => {
    expect(smtpErrorMessage(error({ code: "ETLS" }), {})).toBe(
      "Die verschlüsselte Verbindung kam nicht zustande: Bitte die Verschlüsselung (SSL oder STARTTLS) und den Port prüfen.",
    );
  });

  it("separates a refused sender from a refused recipient", () => {
    expect(
      smtpErrorMessage(
        error({
          code: "EENVELOPE",
          command: "MAIL FROM",
          response: "553 5.7.1 Sender not allowed",
        }),
        {},
      ),
    ).toBe(
      "Der Server erlaubt diese Absenderadresse nicht. Bitte die Adresse Ihres Postfachs als Absender eintragen.",
    );
    expect(
      smtpErrorMessage(
        error({ code: "EENVELOPE", command: "RCPT TO", response: "550 5.1.1 User unknown" }),
        {},
      ),
    ).toBe("Die Empfängeradresse wurde abgelehnt (550 5.1.1 User unknown).");
  });

  it("keeps the server's own words for anything else", () => {
    expect(smtpErrorMessage(error({ response: "421 Try again later" }), {})).toBe(
      "Die E-Mail konnte nicht gesendet werden (421 Try again later).",
    );
    expect(smtpErrorMessage("kaputt", {})).toBe("Die E-Mail konnte nicht gesendet werden.");
  });
});
