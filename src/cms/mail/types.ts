// The owner's mailbox as the admin edits it (/admin/email-versand): pure and client-safe. The
// password is not part of it: it is sealed on the server (src/lib/email/secret.ts) and kept in a
// column of its own, so it never reaches a browser.
import { z } from "zod";

import { isEmail, PROVIDERS } from "../../lib/email/providers";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Höchstens ${max} Zeichen.`)
    .nullish()
    .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null)
  .refine((value) => value === null || isEmail(value), "Bitte eine gültige E-Mail-Adresse.");

export const MailSettingsSchema = z.object({
  provider: z
    .enum(PROVIDERS.map((p) => p.value) as [string, ...string[]])
    .nullish()
    .transform((value) => value ?? null),
  fromAddress: optionalEmail,
  fromName: optionalText(200),
  /** Login name, when it differs from the sender address. */
  username: optionalText(320),
  /** Only for „Anderer Anbieter“. */
  host: optionalText(255),
  port: z
    .number()
    .int("Bitte eine ganze Zahl.")
    .min(1, "Bitte einen Port zwischen 1 und 65535.")
    .max(65535, "Bitte einen Port zwischen 1 und 65535.")
    .nullish()
    .transform((value) => value ?? null),
  security: z
    .enum(["ssl", "starttls", "none"])
    .nullish()
    .transform((value) => value ?? null),
  /** Where a new contact message is announced; empty: nobody is told by mail. */
  notifyAddress: optionalEmail,
});
export type MailSettings = z.output<typeof MailSettingsSchema>;
export type MailSettingsInput = z.input<typeof MailSettingsSchema>;

export const MAIL_DEFAULTS: MailSettings = {
  provider: null,
  fromAddress: null,
  fromName: null,
  username: null,
  host: null,
  port: null,
  security: null,
  notifyAddress: null,
};

// What a logged mail was; a project adds its own (an order confirmation, an invoice).
export const EMAIL_KINDS = {
  test: "Test-E-Mail",
  system: "Passwort-Link",
  anfrage: "Neue Anfrage",
} as const;
export type EmailKind = keyof typeof EMAIL_KINDS;
