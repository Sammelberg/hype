import type { FormDoc, Submission } from "@/cms/content/types";

// What a message is about, at a glance: who wrote, their address, the first line of text.
export function summarize(submission: Submission, form: FormDoc | null) {
  const labels = new Map<string, string>();
  for (const field of form?.fields ?? [])
    if ("name" in field) labels.set(field.name, field.label ?? field.name);
  const get = (...names: string[]) =>
    submission.data.find((d) => names.includes(d.field))?.value ?? null;
  const email =
    submission.data.find((d) => /@/.test(d.value) && /mail/i.test(d.field))?.value ??
    get("email", "e-mail");
  const name = get("name", "vorname", "firma") ?? email ?? "Unbekannt";
  const message =
    get("nachricht", "message", "text") ?? submission.data.map((d) => d.value).join(" · ");
  return { name, email, message, labels };
}
