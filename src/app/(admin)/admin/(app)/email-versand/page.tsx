import type { Metadata } from "next";

import { requireRole } from "@/cms/auth/guard";
import { listMailLog } from "@/cms/mail/log";
import { mailStatus } from "@/cms/mail/send";
import { getMailSettings } from "@/cms/mail/settings";
import { MailEditor } from "./_components/mail-editor";

export const metadata: Metadata = { title: "E-Mail-Versand" };

export default async function EmailVersandPage() {
  await requireRole("admin");
  const [{ settings, passwordSaved }, status, log] = await Promise.all([
    getMailSettings(),
    mailStatus(),
    listMailLog({ limit: 10 }),
  ]);
  return (
    <MailEditor
      settings={settings}
      passwordSaved={passwordSaved}
      status={status}
      log={log.items.map((mail) => ({
        id: mail.id,
        sentAt: mail.sentAt.toISOString(),
        to: mail.to,
        subject: mail.subject,
        kind: mail.kind,
      }))}
      total={log.total}
    />
  );
}
