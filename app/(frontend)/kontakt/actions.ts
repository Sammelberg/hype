"use server";

import { validateSubmission, type ContactField } from "@/lib/contact";
import { getPayloadClient } from "@/lib/payload";
import { getContactForm } from "@/lib/queries";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "invalid"; errors: Record<string, string>; values: Record<string, string> }
  | { status: "error" };

export async function submitContact(_: ContactState, formData: FormData): Promise<ContactState> {
  const form = await getContactForm();
  if (!form) return { status: "error" };

  const fields = (form.fields ?? []).filter(
    (field): field is ContactField & typeof field => "name" in field,
  );
  const result = validateSubmission(fields, formData);

  // Bots get the same answer as people, so they learn nothing about the filter.
  if (result.status === "spam") return { status: "success" };
  if (result.status === "invalid") {
    const values = Object.fromEntries(
      fields.map((field) => [field.name, String(formData.get(field.name) ?? "")]),
    );
    return { status: "invalid", errors: result.errors, values };
  }

  try {
    const payload = await getPayloadClient();
    // Local API: public REST creation of submissions is closed in payload.config.ts.
    await payload.create({
      collection: "form-submissions",
      data: { form: form.id, submissionData: result.data },
    });
    return { status: "success" };
  } catch (error) {
    console.error("Kontaktformular konnte nicht gespeichert werden", error);
    return { status: "error" };
  }
}
