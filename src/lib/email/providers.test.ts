import { describe, expect, it } from "vitest";

import { PROVIDERS, smtpOptions } from "./providers";

const base = { fromAddress: "info@beispiel.de", fromName: "Beispiel GmbH", password: "geheim" };

describe("the SMTP connection from the owner's settings", () => {
  it("fills in mailbox.org's server: SSL on 465, the address as login", () => {
    const result = smtpOptions({ ...base, provider: "mailboxorg" });
    expect(result).toEqual({
      ok: true,
      options: {
        host: "smtp.mailbox.org",
        port: 465,
        secure: true,
        requireTLS: false,
        auth: { user: "info@beispiel.de", pass: "geheim" },
      },
      from: { name: "Beispiel GmbH", address: "info@beispiel.de" },
    });
  });

  it("uses STARTTLS on 587 for IONOS and insists on it", () => {
    const result = smtpOptions({ ...base, provider: "ionos" });
    expect(result.ok && result.options).toMatchObject({
      host: "smtp.ionos.de",
      port: 587,
      secure: false,
      requireTLS: true,
    });
  });

  it("takes a separate login name when the mailbox has one", () => {
    const result = smtpOptions({ ...base, provider: "strato", username: "postfach@beispiel.de" });
    expect(result.ok && result.options.auth.user).toBe("postfach@beispiel.de");
  });

  it("offers every preset with a server, a port and a hint", () => {
    for (const provider of PROVIDERS.filter((p) => p.value !== "andere")) {
      expect(provider.host, provider.value).toMatch(/\./);
      expect([465, 587], provider.value).toContain(provider.port);
      expect(provider.hint.length, provider.value).toBeGreaterThan(20);
    }
    expect(PROVIDERS.map((p) => p.value)).not.toContain("gmail");
    expect(PROVIDERS.map((p) => p.label)).not.toContain("Outlook");
  });

  it("needs server and port for another provider", () => {
    expect(smtpOptions({ ...base, provider: "andere" })).toEqual({
      ok: false,
      problems: [
        "Bitte den Postausgangsserver (SMTP) angeben.",
        "Bitte den Port angeben (meist 465 oder 587).",
      ],
    });
    const custom = smtpOptions({
      ...base,
      provider: "andere",
      host: " mail.beispiel.de ",
      port: 465,
      security: "ssl",
    });
    expect(custom.ok && custom.options).toMatchObject({
      host: "mail.beispiel.de",
      port: 465,
      secure: true,
    });
  });

  it("sends without encryption only inside the own machine or network", () => {
    const open = { ...base, provider: "andere", port: 1025, security: "none" } as const;
    expect(smtpOptions({ ...open, host: "mail.beispiel.de" })).toEqual({
      ok: false,
      problems: [
        "Ohne Verschlüsselung nur für einen Testserver im eigenen Netz (z. B. localhost).",
      ],
    });
    const local = smtpOptions({ ...open, host: "localhost" });
    expect(local.ok && local.options).toMatchObject({ secure: false, requireTLS: false });
    expect(smtpOptions({ ...open, host: "mailpit" }).ok).toBe(true);
  });

  it("names what is missing", () => {
    expect(smtpOptions({ provider: "ionos", fromAddress: "kein-at", password: "" })).toEqual({
      ok: false,
      problems: [
        "Bitte eine gültige Absenderadresse angeben.",
        "Bitte das Passwort Ihres E-Mail-Kontos eingeben.",
      ],
    });
    expect(smtpOptions({ ...base, provider: undefined })).toEqual({
      ok: false,
      problems: ["Bitte Ihren E-Mail-Anbieter wählen."],
    });
  });
});
