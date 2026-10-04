"use server";

import { z } from "zod";

import { writeAudit } from "@/cms/audit/log";
import { db } from "@/cms/db/client";
import { testMail } from "@/lib/email/messages";
import { mailStatus, sendMail } from "@/cms/mail/send";
import { MailError, saveMailSettings, setMailPassword } from "@/cms/mail/settings";
import { MailSettingsSchema } from "@/cms/mail/types";
import { adminActionClient } from "./client";

// „E-Mail-Versand“: the mailbox's settings, its password in a dialog of its own, the test mail.
// The password goes in and is never read back to a browser.

export const saveMailSettingsAction = adminActionClient
  .inputSchema(MailSettingsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await saveMailSettings(parsedInput);
    await writeAudit(db, {
      actor: ctx.user,
      action: "email.eingerichtet",
      details: { anbieter: parsedInput.provider, absender: parsedInput.fromAddress },
    });
  });

export const setMailPasswordAction = adminActionClient
  .inputSchema(z.object({ password: z.string().max(500) }))
  .action(async ({ parsedInput, ctx }) => {
    // Passwords may start or end with a space; they are stored exactly as typed.
    if (!parsedInput.password) throw new MailError("Bitte ein Passwort eingeben.", "password");
    await setMailPassword(parsedInput.password);
    await writeAudit(db, { actor: ctx.user, action: "email.passwort-gesetzt" });
  });

export const clearMailPasswordAction = adminActionClient.action(async ({ ctx }) => {
  await setMailPassword("");
  await writeAudit(db, { actor: ctx.user, action: "email.passwort-geloescht" });
});

/** A test mail to the sender's own address: proves login, server and sender in one go. */
export const sendTestMailAction = adminActionClient.action(async ({ ctx }) => {
  const status = await mailStatus();
  if (!status.ready) throw new MailError(status.problems.join(" "));
  const mail = testMail(status.fromName || status.address);
  await sendMail({ to: status.address, ...mail }, { kind: "test", sentById: ctx.user.id });
  return { to: status.address };
});
