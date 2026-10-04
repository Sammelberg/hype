"use server";

import { headers } from "next/headers";
import { after } from "next/server";

import { validateSubmission, type ContactField } from "./_lib/validation";
import { createSubmission } from "@/cms/content/forms";
import { announceAnfrage } from "@/cms/mail/anfrage";
import { clientIp } from "@/cms/security/client-ip";
import { hitRateLimit, LIMITS } from "@/cms/security/rate-limit";
import { getContactForm } from "@/data/queries";
import { env } from "@/env";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "invalid"; errors: Record<string, string>; values: Record<string, string> }
  | { status: "limited"; minutes: number; values: Record<string, string> }
  | { status: "error" };

export async function submitContact(_: ContactState, formData: FormData): Promise<ContactState> {
  const form = await getContactForm();
  if (!form) return { status: "error" };

  const fields = form.fields.filter(
    (field): field is ContactField & typeof field => "name" in field,
  );
  const result = validateSubmission(fields, formData, env.FORM_SECRET);
  const values = () =>
    Object.fromEntries(fields.map((field) => [field.name, String(formData.get(field.name) ?? "")]));

  // Bots get the same answer as people, so they learn nothing about the filter.
  if (result.status === "spam") return { status: "success" };
  if (result.status === "invalid")
    return { status: "invalid", errors: result.errors, values: values() };

  // A few messages per address and ten minutes: enough for people, a wall for a flood.
  const limit = await hitRateLimit(`kontakt:${clientIp(await headers())}`, LIMITS.contact);
  if (!limit.ok) {
    return {
      status: "limited",
      minutes: Math.max(1, Math.ceil(limit.retryAfterSeconds / 60)),
      values: values(),
    };
  }

  try {
    // Straight into our own table; there is no public API for messages.
    const id = await createSubmission(form.id, result.data);
    // After the answer: a slow or refusing mail server never delays or fails the visitor's message.
    after(() =>
      announceAnfrage({ id, formTitle: form.title, fields: form.fields, data: result.data }).catch(
        (error) => console.error("Benachrichtigung über die neue Anfrage nicht gesendet", error),
      ),
    );
    return { status: "success" };
  } catch (error) {
    console.error("Kontaktformular konnte nicht gespeichert werden", error);
    return { status: "error" };
  }
}
