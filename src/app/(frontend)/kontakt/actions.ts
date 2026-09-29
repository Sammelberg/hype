"use server";

import { validateSubmission, type ContactField } from "./_lib/validation";
import { createSubmission } from "@/cms/content/forms";
import { getContactForm } from "@/data/queries";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "invalid"; errors: Record<string, string>; values: Record<string, string> }
  | { status: "error" };

export async function submitContact(_: ContactState, formData: FormData): Promise<ContactState> {
  const form = await getContactForm();
  if (!form) return { status: "error" };

  const fields = form.fields.filter(
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
    // Straight into our own table; there is no public API for messages.
    await createSubmission(form.id, result.data);
    return { status: "success" };
  } catch (error) {
    console.error("Kontaktformular konnte nicht gespeichert werden", error);
    return { status: "error" };
  }
}
