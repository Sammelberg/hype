// The owner's mailbox (cms.mail_settings, one row): what /admin/email-versand edits, and the
// sealed password beside it. Reading the settings never returns the password; `mailbox()` opens
// it for sending only.
import { eq } from "drizzle-orm";

import { env } from "../../env";
import { openSecret, sealSecret } from "../../lib/email/secret";
import { db, type Db, type Tx } from "../db/client";
import { mailSettings } from "../db/schema";
import { CmsError } from "../errors";
import { MAIL_DEFAULTS, type MailSettings, MailSettingsSchema } from "./types";

const ID = 1;

export class MailError extends CmsError {}

const NO_SECRET =
  "Auf dem Server fehlt MAIL_SECRET: Ohne diesen Schlüssel wird kein Passwort gespeichert. Tragen Sie ihn in die .env ein (openssl rand -base64 32) und starten Sie die Website neu.";

async function row(client: Db | Tx = db) {
  const [found] = await client.select().from(mailSettings).where(eq(mailSettings.id, ID)).limit(1);
  return found ?? null;
}

/** The settings as the admin edits them, and whether a password is stored. */
export async function getMailSettings(
  client: Db | Tx = db,
): Promise<{ settings: MailSettings; passwordSaved: boolean }> {
  const found = await row(client);
  if (!found) return { settings: { ...MAIL_DEFAULTS }, passwordSaved: false };
  const parsed = MailSettingsSchema.safeParse(found.data);
  return {
    settings: parsed.success ? parsed.data : { ...MAIL_DEFAULTS, ...found.data },
    passwordSaved: Boolean(found.passwordSealed),
  };
}

export async function saveMailSettings(input: unknown, client: Db | Tx = db) {
  const data = MailSettingsSchema.parse(input);
  await client
    .insert(mailSettings)
    .values({ id: ID, data })
    .onConflictDoUpdate({ target: mailSettings.id, set: { data, updatedAt: new Date() } });
  return data;
}

/** Seals and stores the mailbox password, exactly as typed; the empty string deletes it. */
export async function setMailPassword(password: string, client: Db | Tx = db) {
  if (password && !env.MAIL_SECRET) throw new MailError(NO_SECRET);
  const passwordSealed = password ? sealSecret(password, env.MAIL_SECRET!) : null;
  await client
    .insert(mailSettings)
    .values({ id: ID, data: MAIL_DEFAULTS, passwordSealed })
    .onConflictDoUpdate({
      target: mailSettings.id,
      set: { passwordSealed, updatedAt: new Date() },
    });
}

/** For sending only: the settings with the opened password, and why it could not be opened. */
export async function mailbox(client: Db | Tx = db) {
  const { settings } = await getMailSettings(client);
  const sealed = (await row(client))?.passwordSealed ?? null;
  const password = sealed && env.MAIL_SECRET ? openSecret(sealed, env.MAIL_SECRET) : null;
  const problem = !sealed
    ? null
    : !env.MAIL_SECRET
      ? NO_SECRET
      : !password
        ? "Das gespeicherte Passwort lässt sich nicht mehr lesen (MAIL_SECRET wurde geändert). Bitte geben Sie es neu ein."
        : null;
  return { settings, password, problem };
}
