// Nodemailer's errors in words the owner can act on. Nodemailer sets `code` (EAUTH, ECONNECTION,
// ETIMEDOUT, ETLS, EENVELOPE …), the failing SMTP `command` and the server's `response`.

interface SmtpFailure {
  code?: string;
  command?: string;
  response?: string;
  responseCode?: number;
}

const UNREACHABLE = new Set(["ECONNECTION", "ESOCKET", "EDNS", "ENOTFOUND", "ECONNREFUSED"]);

export function smtpErrorMessage(
  reason: unknown,
  context: { provider?: string | null; host?: string | null },
): string {
  const failure: SmtpFailure = typeof reason === "object" && reason !== null ? reason : {};
  const server = context.host || "dem Postausgangsserver";

  if (failure.code === "EAUTH" || failure.responseCode === 535 || failure.responseCode === 534) {
    return context.host === "smtp.gmail.com"
      ? "Anmeldung abgelehnt: Bitte Adresse und Passwort prüfen. Gmail verlangt ein App-Passwort, nicht Ihr normales Google-Passwort."
      : "Anmeldung abgelehnt: Bitte Adresse und Passwort prüfen.";
  }
  if (failure.code && UNREACHABLE.has(failure.code)) {
    return `Keine Verbindung zu ${server}: Bitte Server und Port prüfen.`;
  }
  if (failure.code === "ETIMEDOUT" || failure.code === "ETIMEOUT") {
    return `${context.host || "Der Postausgangsserver"} antwortet nicht. Bitte später erneut versuchen oder Server und Port prüfen.`;
  }
  if (failure.code === "ETLS") {
    return "Die verschlüsselte Verbindung kam nicht zustande: Bitte die Verschlüsselung (SSL oder STARTTLS) und den Port prüfen.";
  }
  if (failure.command === "MAIL FROM") {
    return "Der Server erlaubt diese Absenderadresse nicht. Bitte die Adresse Ihres Postfachs als Absender eintragen.";
  }
  if (failure.command === "RCPT TO") {
    return `Die Empfängeradresse wurde abgelehnt${failure.response ? ` (${failure.response})` : ""}.`;
  }
  return `Die E-Mail konnte nicht gesendet werden${failure.response ? ` (${failure.response})` : ""}.`;
}
