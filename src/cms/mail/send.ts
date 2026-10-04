// Sending through the owner's mailbox (/admin/email-versand). One SMTP connection per message (a
// few mails a day need no pool); each sent mail is logged in „Gesendete E-Mails“. No transaction
// around it: the mail is out once the server accepted it, and the log row follows.
import { smtpErrorMessage } from "../../lib/email/errors";
import { smtpOptions } from "../../lib/email/providers";
import type { EmailKind } from "./types";
import { logMail } from "./log";
import { MailError, mailbox } from "./settings";

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  /** Where answers go, when not to the sender (a contact message: to the person who wrote). */
  replyTo?: string | null;
  attachments?: { filename: string; content: Buffer | Uint8Array | string; contentType: string }[];
}

export type MailStatus =
  { ready: true; fromName: string; address: string } | { ready: false; problems: string[] };

/** Whether mail can go out, and what is missing if not. */
export async function mailStatus(): Promise<MailStatus> {
  const { settings, password, problem } = await mailbox();
  const result = smtpOptions({ ...settings, password });
  if (result.ok) return { ready: true, fromName: result.from.name, address: result.from.address };
  return {
    ready: false,
    problems: problem
      ? [problem, ...result.problems.filter((p) => !p.startsWith("Bitte das Passwort"))]
      : result.problems,
  };
}

/** Sends one message and logs it; throws a MailError the owner can act on. */
export async function sendMail(
  mail: OutgoingMail,
  log: {
    kind: EmailKind;
    sentById?: number | null;
    /** The document the mail carries, for its own list of sent mails. */
    target?: { type: string; id: string | number } | null;
  },
) {
  const { settings, password, problem } = await mailbox();
  const result = smtpOptions({ ...settings, password });
  if (!result.ok) {
    throw new MailError(
      `Der E-Mail-Versand ist noch nicht eingerichtet: ${[problem, ...result.problems].filter(Boolean).join(" ")}`,
    );
  }
  const { createTransport } = await import("nodemailer");
  const connection = createTransport({
    ...result.options,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  try {
    const info = await connection.sendMail({
      from: result.from.name
        ? { name: result.from.name, address: result.from.address }
        : result.from.address,
      to: mail.to,
      replyTo: mail.replyTo ?? undefined,
      subject: mail.subject,
      text: mail.text,
      attachments: mail.attachments?.map((file) => ({
        filename: file.filename,
        content: typeof file.content === "string" ? file.content : Buffer.from(file.content),
        contentType: file.contentType,
      })),
    });
    await logMail({
      to: mail.to,
      subject: mail.subject,
      kind: log.kind,
      sentById: log.sentById ?? null,
      messageId: info.messageId ?? null,
      targetType: log.target?.type ?? null,
      targetId: log.target ? String(log.target.id) : null,
    });
    return info;
  } catch (error) {
    if (error instanceof MailError) throw error;
    console.warn("E-Mail-Versand fehlgeschlagen", error);
    throw new MailError(
      smtpErrorMessage(error, { provider: settings.provider, host: result.options.host }),
    );
  } finally {
    connection.close();
  }
}

/**
 * The site's own mails (password link, new contact message): sent when the mailbox is set up,
 * otherwise noted in the server log; `sent` says which. Never throws for a missing setup.
 */
export async function sendSiteMail(
  mail: OutgoingMail,
  kind: EmailKind,
): Promise<{ sent: boolean }> {
  const status = await mailStatus();
  if (!status.ready) {
    console.info(`E-Mail nicht gesendet (E-Mail-Versand nicht eingerichtet): „${mail.subject}“`);
    return { sent: false };
  }
  await sendMail(mail, { kind });
  return { sent: true };
}
