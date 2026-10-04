// The mail providers the owner can pick in „E-Mail-Versand“, and the SMTP connection built from
// their settings. Password login only: Microsoft (Outlook, Microsoft 365) allows OAuth alone and is
// left out. The presets are German and EU mailboxes (data sovereignty, CLAUDE.md); any other
// SMTP server, Gmail included, is the owner's own choice under „Anderer Anbieter“.

export type Security = "ssl" | "starttls" | "none";

export interface Provider {
  value: string;
  label: string;
  host: string;
  port: number;
  security: Security;
  /** Where the owner gets the password this provider accepts. */
  hint: string;
}

export const PROVIDERS: readonly Provider[] = [
  {
    value: "ionos",
    label: "IONOS",
    host: "smtp.ionos.de",
    port: 587,
    security: "starttls",
    hint: "Das Passwort Ihres IONOS-Postfachs, nicht das Ihres IONOS-Kundenkontos.",
  },
  {
    value: "gmx",
    label: "GMX",
    host: "mail.gmx.net",
    port: 587,
    security: "starttls",
    hint: "Erlauben Sie in GMX unter „E-Mail → Einstellungen → POP3/IMAP-Abruf“ den Zugriff über externe Programme. Mit Zwei-Faktor-Schutz brauchen Sie ein anwendungsspezifisches Passwort.",
  },
  {
    value: "webde",
    label: "WEB.DE",
    host: "smtp.web.de",
    port: 587,
    security: "starttls",
    hint: "Erlauben Sie in WEB.DE unter „E-Mail → Einstellungen → POP3/IMAP-Abruf“ den Zugriff über externe Programme. Mit Zwei-Faktor-Schutz brauchen Sie ein anwendungsspezifisches Passwort.",
  },
  {
    value: "strato",
    label: "STRATO",
    host: "smtp.strato.de",
    port: 465,
    security: "ssl",
    hint: "Das Passwort Ihres STRATO-Postfachs, festgelegt im Kunden-Login unter „E-Mail-Verwaltung“.",
  },
  {
    value: "telekom",
    label: "Telekom (T-Online)",
    host: "securesmtp.t-online.de",
    port: 465,
    security: "ssl",
    hint: "T-Online verlangt ein eigenes E-Mail-Passwort. Sie legen es im Telekom Kundencenter unter „E-Mail-Passwort“ fest; Ihr Telekom-Login-Passwort funktioniert hier nicht.",
  },
  {
    value: "posteo",
    label: "Posteo",
    host: "posteo.de",
    port: 587,
    security: "starttls",
    hint: "Das Passwort Ihres Posteo-Kontos.",
  },
  {
    value: "mailboxorg",
    label: "mailbox.org",
    host: "smtp.mailbox.org",
    port: 465,
    security: "ssl",
    hint: "Das Passwort Ihres mailbox.org-Kontos; mit Zwei-Faktor-Schutz ein Anwendungspasswort.",
  },
  {
    value: "andere",
    label: "Anderer Anbieter",
    host: "",
    port: 587,
    security: "starttls",
    hint: "Server, Port und Verschlüsselung stehen in der Hilfe Ihres Anbieters unter „SMTP“ oder „Postausgangsserver“.",
  },
];

export interface MailSettings {
  provider?: string | null;
  fromAddress?: string | null;
  fromName?: string | null;
  /** Login name, when it differs from the sender address. */
  username?: string | null;
  password?: string | null;
  /** Only for „Anderer Anbieter“. */
  host?: string | null;
  port?: number | null;
  security?: Security | null;
}

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  auth: { user: string; pass: string };
}

export type SmtpResult =
  | { ok: true; options: SmtpOptions; from: { name: string; address: string } }
  | { ok: false; problems: string[] };

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Plain SMTP only to the own machine or a name inside the own network (a container name).
const isLocal = (host: string) =>
  host === "localhost" || host === "::1" || host.startsWith("127.") || !host.includes(".");

export function smtpOptions(settings: MailSettings): SmtpResult {
  const provider = PROVIDERS.find((option) => option.value === settings.provider);
  if (!provider) return { ok: false, problems: ["Bitte Ihren E-Mail-Anbieter wählen."] };

  const problems: string[] = [];
  const address = settings.fromAddress?.trim() ?? "";
  if (!isEmail(address)) problems.push("Bitte eine gültige Absenderadresse angeben.");
  const password = settings.password ?? "";
  if (!password) problems.push("Bitte das Passwort Ihres E-Mail-Kontos eingeben.");

  const custom = provider.value === "andere";
  const host = custom ? (settings.host?.trim() ?? "") : provider.host;
  const port = custom ? (settings.port ?? 0) : provider.port;
  const security = custom ? (settings.security ?? "starttls") : provider.security;
  if (custom && !host) problems.push("Bitte den Postausgangsserver (SMTP) angeben.");
  if (custom && !(Number.isInteger(port) && port > 0 && port < 65536)) {
    problems.push("Bitte den Port angeben (meist 465 oder 587).");
  }
  if (security === "none" && host && !isLocal(host)) {
    problems.push(
      "Ohne Verschlüsselung nur für einen Testserver im eigenen Netz (z. B. localhost).",
    );
  }
  if (problems.length > 0) return { ok: false, problems };

  return {
    ok: true,
    options: {
      host,
      port,
      secure: security === "ssl",
      requireTLS: security === "starttls",
      auth: { user: settings.username?.trim() || address, pass: password },
    },
    from: { name: settings.fromName?.trim() ?? "", address },
  };
}
