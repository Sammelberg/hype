// A new contact message, announced by e-mail to the address set under „E-Mail-Versand“ (if any).
// The message itself stays in the inbox (/admin/anfragen); the mail carries what was written so
// the owner can answer from the mailbox, with Reply-To set to the sender when the form asked for
// an e-mail address.
import { env } from "../../env";
import { anfrageMail } from "../../lib/email/messages";
import { getSiteSettings } from "../content/site-settings";
import type { FormField } from "../content/types";
import { sendSiteMail } from "./send";
import { getMailSettings } from "./settings";
import { isEmail } from "../../lib/email/providers";

export async function announceAnfrage(input: {
  id: number;
  formTitle: string;
  fields: FormField[];
  data: { field: string; value: string }[];
}) {
  const { settings } = await getMailSettings();
  if (!settings.notifyAddress) return { sent: false };
  const site = await getSiteSettings();
  const labelOf = (name: string) => {
    const field = input.fields.find((f) => "name" in f && f.name === name);
    return (field && "label" in field && field.label) || name;
  };
  const emailField = input.fields.find((f) => f.blockType === "email");
  const replyTo =
    emailField && "name" in emailField
      ? input.data.find((d) => d.field === emailField.name)?.value.trim()
      : undefined;
  const mail = anfrageMail({
    siteName: site?.siteName || "Website",
    formTitle: input.formTitle,
    fields: input.data.map((d) => ({ label: labelOf(d.field), value: d.value })),
    url: new URL(`/admin/anfragen/${input.id}`, env.NEXT_PUBLIC_SERVER_URL).toString(),
  });
  return sendSiteMail(
    { to: settings.notifyAddress, replyTo: replyTo && isEmail(replyTo) ? replyTo : null, ...mail },
    "anfrage",
  );
}
